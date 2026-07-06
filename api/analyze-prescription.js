import { verifyExtractionAgainstOcr } from '../src/utils/strictOcrGuard.js';

const OCR_PROMPT = `You are an OCR transcription engine for medical documents.

Transcribe ALL visible text exactly as it appears, in reading order.
Preserve line breaks and abbreviations.
Do NOT diagnose.
Do NOT summarize.
Do NOT interpret.
Do NOT correct spelling.
Do NOT infer missing characters, names, medicines, doses, schedules, or dates.
For any unreadable token, write [NOT CLEARLY READABLE].
Return the raw OCR transcription only.`;

const EXTRACTION_PROMPT = `You are a strict medical OCR extraction engine.

Do NOT diagnose.
Do NOT summarize.
Do NOT recommend medicines.
Do NOT infer missing information.
Do NOT substitute medicine names.
Only extract information explicitly present in the OCR text below.
Every string value must be copied from the OCR text, except the fallback phrase "Not clearly readable".
If uncertain, missing, ambiguous, or illegible, write exactly: Not clearly readable.
Never write "As Directed" unless those exact words appear in the OCR text.
Never guess dosage, frequency, food timing, duration, doctor name, patient name, or date.
Set morning, afternoon, and night to true only when explicitly supported. TDS or 1-1-1 supports all three periods.
Return STRICT JSON only matching the provided schema.

RAW OCR TEXT:
`;

const responseSchema = {
  type: 'object',
  properties: {
    hospital: {
      type: 'object',
      properties: { name: { type: 'string' }, address: { type: 'string' } },
      required: ['name', 'address'],
    },
    doctor: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        qualification: { type: 'string' },
        registrationNo: { type: 'string' },
      },
      required: ['name', 'qualification', 'registrationNo'],
    },
    patient: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'string' },
        gender: { type: 'string' },
      },
      required: ['name', 'age', 'gender'],
    },
    date: { type: 'string' },
    medicines: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          strength: { type: 'string' },
          dosage: { type: 'string' },
          frequency: { type: 'string' },
          morning: { type: 'boolean' },
          afternoon: { type: 'boolean' },
          night: { type: 'boolean' },
          foodTiming: { type: 'string' },
          duration: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['name', 'strength', 'dosage', 'frequency', 'morning', 'afternoon', 'night', 'foodTiming', 'duration', 'notes'],
      },
    },
    advice: { type: 'string' },
    doctorSignatureDetected: { type: 'string', enum: ['Yes', 'No', 'Not clearly readable'] },
    confidence: { type: 'number' },
  },
  required: ['hospital', 'doctor', 'patient', 'date', 'medicines', 'advice', 'doctorSignatureDetected', 'confidence'],
};

function getText(payload) {
  return payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim() || '';
}

function parseJson(text) {
  const cleaned = String(text || '').replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleaned);
}

async function generate({ apiKey, model, parts, generationConfig }) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0,
        topP: 0.1,
        maxOutputTokens: 8192,
        ...generationConfig,
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || `Gemini returned ${response.status}.`);
  return getText(payload);
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.', code: 'method_not_allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return response.status(503).json({ error: 'OCR service is not configured.', code: 'service_not_configured' });

  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    const imageBase64 = typeof body?.imageBase64 === 'string' ? body.imageBase64 : '';
    const mimeType = typeof body?.mimeType === 'string' ? body.mimeType : '';
    if (!imageBase64 || !/^image\/(?:jpeg|png|webp)$/.test(mimeType)) {
      return response.status(400).json({ error: 'A supported image is required.', code: 'invalid_image' });
    }
    if (imageBase64.length > 4_000_000) {
      return response.status(413).json({ error: 'The prepared OCR image is too large.', code: 'image_too_large' });
    }

    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    const ocrText = await generate({
      apiKey,
      model,
      parts: [
        { inline_data: { mime_type: mimeType, data: imageBase64 } },
        { text: OCR_PROMPT },
      ],
      generationConfig: { responseMimeType: 'text/plain' },
    });

    if (ocrText.length < 4) {
      return response.status(422).json({ error: 'No readable text was found in the image.', code: 'ocr_empty' });
    }

    const extractionText = await generate({
      apiKey,
      model,
      parts: [{ text: `${EXTRACTION_PROMPT}${ocrText}` }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    const candidate = parseJson(extractionText);
    const verified = verifyExtractionAgainstOcr(ocrText, candidate);
    return response.status(200).json({
      ocrText,
      ocrConfidence: verified.extraction.confidence,
      extraction: verified.extraction,
      audit: verified.audit,
      model,
    });
  } catch (error) {
    return response.status(502).json({
      error: 'The OCR extraction pipeline failed safely. No medical information was generated.',
      code: 'extraction_failed',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

