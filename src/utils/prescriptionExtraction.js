import { verifyExtractionAgainstOcr } from './strictOcrGuard.js';

const MAX_IMAGE_DIMENSION = 1600;
const CONFIGURED_ENDPOINT = import.meta.env.VITE_PRESCRIPTION_EXTRACTION_ENDPOINT?.trim();
const ENDPOINT = CONFIGURED_ENDPOINT || '/api/analyze-prescription';

const titleByType = {
  prescription: 'Source-Verified Prescription Extraction',
  medicine: 'Source-Verified Medicine Label Extraction',
  report: 'Source-Verified Medical Report Extraction',
};

export class ExtractionPipelineError extends Error {
  constructor(message, code = 'extraction_failed') {
    super(message);
    this.name = 'ExtractionPipelineError';
    this.code = code;
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new ExtractionPipelineError('The selected image could not be prepared for OCR.', 'image_read_failed'));
    reader.readAsDataURL(blob);
  });
}

async function prepareImageForOcr(file) {
  let image;
  try {
    image = await createImageBitmap(file);
  } catch {
    throw new ExtractionPipelineError('The selected image could not be decoded for OCR.', 'image_decode_failed');
  }

  try {
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new ExtractionPipelineError('Image processing is unavailable in this browser.', 'canvas_unavailable');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (!blob) throw new ExtractionPipelineError('The image could not be prepared for OCR.', 'image_compression_failed');
    return { imageBase64: await blobToBase64(blob), mimeType: 'image/jpeg' };
  } finally {
    image.close?.();
  }
}

async function readJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new ExtractionPipelineError('The OCR service is not configured for this environment. No medical data was generated.', 'service_unavailable');
  }

  const payload = await response.json();
  if (!response.ok) {
    throw new ExtractionPipelineError(payload?.error || 'The OCR service could not process this image.', payload?.code || 'service_error');
  }
  return payload;
}

export async function extractMedicalDocument(file, {
  analysisType = 'prescription',
  validation,
  signal,
  onStage,
} = {}) {
  onStage?.('preparing');
  const image = await prepareImageForOcr(file);
  if (signal?.aborted) throw new DOMException('Extraction cancelled.', 'AbortError');

  onStage?.('ocr');
  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...image,
        fileName: file.name,
        analysisType,
      }),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ExtractionPipelineError('The OCR service could not be reached. No medical data was generated.', 'service_unavailable');
  }

  const payload = await readJsonResponse(response);
  const rawOcrText = typeof payload.ocrText === 'string' ? payload.ocrText.trim() : '';
  if (rawOcrText.length < 4) {
    throw new ExtractionPipelineError('No readable prescription text was found. Please upload a clearer image.', 'ocr_empty');
  }

  onStage?.('verifying');
  const { extraction, audit: clientAudit } = verifyExtractionAgainstOcr(rawOcrText, payload.extraction);
  const serverAudit = payload.audit && typeof payload.audit === 'object' ? payload.audit : {};
  const audit = {
    checkedFields: Math.max(clientAudit.checkedFields, Number(serverAudit.checkedFields) || 0),
    verifiedFields: Math.min(
      Math.max(clientAudit.verifiedFields, Number(serverAudit.verifiedFields) || 0),
      Math.max(clientAudit.checkedFields, Number(serverAudit.checkedFields) || 0),
    ),
    rejectedFields: [...new Set([...(serverAudit.rejectedFields || []), ...clientAudit.rejectedFields])],
    rejectedMedicines: [...new Set([...(serverAudit.rejectedMedicines || []), ...clientAudit.rejectedMedicines])],
  };
  const ocrConfidence = Number(payload.ocrConfidence);
  if (Number.isFinite(ocrConfidence)) extraction.confidence = Math.min(extraction.confidence, Math.max(0, Math.min(1, ocrConfidence)));

  return {
    id: `analysis-${Date.now()}`,
    type: analysisType,
    title: titleByType[analysisType] || titleByType.prescription,
    sourceVerified: true,
    pipelineVersion: 'ocr-first-v1',
    analyzedAt: new Date().toISOString(),
    sourceFileName: file.name,
    documentType: validation?.documentType || analysisType,
    rawOcrText,
    ...extraction,
    audit,
    warning: 'Every displayed value was checked against the OCR transcription. Unverified values were removed or marked “Not clearly readable.”',
  };
}
