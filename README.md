# MediLens AI

MediLens AI is a responsive medical prescription, medicine, and report extraction assistant. Uploaded files use an OCR-first, source-verified pipeline; the app does not generate example medicines or substitute unreadable medical fields.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal.

## Production build

```bash
npm run build
npm run preview
```

## Medical document validation

The app performs local file, image-quality, and conservative medical-document checks before enabling analysis. For production semantic classification, configure a secure server-side vision endpoint:

```env
VITE_MEDICAL_VALIDATION_ENDPOINT=https://your-api.example.com/validate-medical-document
```

The endpoint receives a multipart `image` and `expectedDocumentType` and must return:

```json
{
  "isMedicalDocument": true,
  "documentType": "prescription",
  "confidence": 0.92,
  "medicalSignals": ["Rx heading", "Doctor name", "Medicine dosage"],
  "reason": "Prescription layout and medical fields detected."
}
```

`prescription`, `lab_report`, `medical_report`, `medicine_label`, and `unknown` are valid classifier types. Documents pass automatically at confidence `0.55` or higher when at least two medical signals are present. Results from `0.4` to `0.55`, or results with useful medical evidence but unclear details, become a user-confirmed borderline state. Clearly unrelated results below `0.4` with no medical signals remain blocked. Keep Gemini or other vision-model credentials on the server; never expose them through a `VITE_` browser variable.

## OCR-first extraction

The included `/api/analyze-prescription` Vercel function performs two separate Gemini calls:

1. Exact OCR transcription from the uploaded image, with no summarization or interpretation.
2. Strict JSON extraction from the OCR text only.

The server and browser both compare the extracted JSON with the raw OCR text. Unsupported medicines are removed; unsupported fields become `Not clearly readable`. If the OCR service is unavailable, analysis stops safely and no result is created.

Configure these server-only variables in Vercel:

```env
GEMINI_API_KEY=your_server_only_key
GEMINI_MODEL=gemini-3.5-flash
```

For another compatible backend, set `VITE_PRESCRIPTION_EXTRACTION_ENDPOINT`. The endpoint must return `{ "ocrText": "...", "ocrConfidence": 0.0, "extraction": { ... } }`.

## Deploy to Vercel

Import this folder into Vercel or connect its GitHub repository. Vercel will detect Vite and use the included `vercel.json` configuration.

## Safety

MediLens AI is an assistance tool, not a replacement for a qualified doctor or pharmacist. Do not start, stop, or change medication without professional confirmation.
