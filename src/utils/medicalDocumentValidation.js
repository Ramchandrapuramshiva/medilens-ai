const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const SUPPORTED_EXTENSION = /\.(?:jpe?g|png|webp)$/i;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MIN_IMAGE_EDGE = 160;
const MIN_IMAGE_AREA = 25_000;

const MEDICAL_DOCUMENT_TYPES = new Set([
  'prescription',
  'lab_report',
  'medical_report',
  'medicine_label',
  'unknown',
]);

const MEDICAL_SIGNAL_PATTERNS = [
  { label: 'Prescription or Rx', pattern: /\b(?:rx|prescription|prescribed\s+by|prescriber)\b/i },
  { label: 'Doctor or clinical provider', pattern: /\b(?:doctor|dr\.?|physician|hospital|clinic|medical\s+centre|medical\s+center)\b/i },
  { label: 'Patient details', pattern: /\b(?:patient|patient\s+name|age|date\s+of\s+birth|dob|gender|sex|visit\s+date)\b/i },
  { label: 'Medicine or dosage', pattern: /\b(?:medicine|medication|tablet|capsule|syrup|injection|dosage|dose|strength|once\s+daily|twice\s+daily|mg|mcg|ml)\b/i },
  { label: 'Recognized medicine name', pattern: /\b(?:amoxicillin|azithromycin|paracetamol|acetaminophen|ibuprofen|aspirin|metformin|atorvastatin|pantoprazole|omeprazole|cetirizine|insulin)\b/i },
  { label: 'Lab test or value', pattern: /\b(?:laboratory|lab|specimen|test\s+name|test\s+result|reference\s+range|normal\s+range|hemoglobin|glucose|platelet|blood|urine|cbc|wbc|rbc)\b/i },
  { label: 'Medical report heading', pattern: /\b(?:medical\s+report|diagnostic\s+report|radiology|pathology|clinical\s+report|diagnosis|impression|findings)\b/i },
  { label: 'Medicine packaging', pattern: /\b(?:blister|strip|manufacturer|batch|expiry|expires|mfg|manufactured)\b/i },
];

const LAB_TERMS = /\b(?:laboratory|lab|specimen|reference\s+range|hemoglobin|glucose|platelet|blood|urine|test\s+result|cbc|wbc|rbc)\b/i;
const MEDICINE_TERMS = /\b(?:medicine|medication|tablet|capsule|syrup|dosage|dose|manufacturer|batch|expiry|mfg|mg|ml|blister|strip)\b/i;
const PRESCRIPTION_TERMS = /\b(?:prescription|prescribed\s+by|doctor|dr\.?|clinic|pharmacy|dosage|rx)\b/i;
const CLEARLY_UNRELATED_FILE_TERMS = /\b(?:selfie|portrait|vacation|holiday|sunset|landscape|scenery|food|meal|meme|wallpaper|resume|invoice|menu)\b/i;
const SCREENSHOT_FILE_TERMS = /\b(?:screenshot|screen[\s_-]?shot)\b/i;

export const INVALID_DOCUMENT_MESSAGE = 'Invalid medical document. Please upload a prescription, lab report, or medical report.';
export const BORDERLINE_DOCUMENT_MESSAGE = 'This looks like a medical document, but some details are unclear. You can continue analysis or upload a clearer image.';

const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));

function uniqueSignals(signals) {
  return [...new Set(signals.filter(Boolean))].slice(0, 8);
}

function invalidResult(reason, code = 'invalid_document', medicalSignals = [], visualSignals = []) {
  return {
    status: 'invalid',
    isMedicalDocument: false,
    documentType: 'unknown',
    confidence: 0,
    medicalSignals: uniqueSignals(medicalSignals),
    visualSignals: uniqueSignals(visualSignals),
    code,
    message: code === 'invalid_document' ? INVALID_DOCUMENT_MESSAGE : reason,
    reason,
  };
}

function borderlineResult(documentType, confidence, reason, method, medicalSignals = [], visualSignals = []) {
  return {
    status: 'borderline',
    isMedicalDocument: true,
    documentType,
    confidence: clamp(confidence, 0.4, 0.55),
    medicalSignals: uniqueSignals(medicalSignals),
    visualSignals: uniqueSignals(visualSignals),
    code: 'borderline',
    message: BORDERLINE_DOCUMENT_MESSAGE,
    reason,
    method,
    continued: false,
  };
}

function validResult(documentType, confidence, reason, method, medicalSignals = [], visualSignals = []) {
  return {
    status: 'valid',
    isMedicalDocument: true,
    documentType,
    confidence: clamp(confidence),
    medicalSignals: uniqueSignals(medicalSignals),
    visualSignals: uniqueSignals(visualSignals),
    code: 'valid',
    message: 'Medical document verified.',
    reason,
    method,
  };
}

function validateFileBasics(file) {
  if (!file) return invalidResult('Please choose an image to continue.', 'missing_file');

  if (!SUPPORTED_TYPES.has(file.type) || !SUPPORTED_EXTENSION.test(file.name)) {
    return invalidResult('Unsupported file format. Please choose a JPG, JPEG, PNG, or WEBP image.', 'unsupported_type');
  }

  if (file.size > MAX_FILE_SIZE) {
    return invalidResult('This image is too large. Please choose an image smaller than 10 MB.', 'file_too_large');
  }

  if (file.size === 0) {
    return invalidResult('The selected image is empty. Please choose another image.', 'empty_file');
  }

  return null;
}

async function decodeImage(file) {
  if ('createImageBitmap' in window) return window.createImageBitmap(file);

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function inspectPixels(image) {
  const sourceWidth = image.width || image.naturalWidth;
  const sourceHeight = image.height || image.naturalHeight;
  const scale = Math.min(1, 256 / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) throw new Error('Image inspection is unavailable.');
  context.drawImage(image, 0, 0, width, height);

  const pixels = context.getImageData(0, 0, width, height).data;
  const luminance = new Float32Array(width * height);
  const rowInk = new Uint32Array(height);
  let sum = 0;
  let sumSquares = 0;
  let neutralLight = 0;
  let whitePaper = 0;
  let colorful = 0;
  let skin = 0;
  let veryDark = 0;
  let veryLight = 0;

  for (let index = 0, pixelIndex = 0; index < pixels.length; index += 4, pixelIndex += 1) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const saturation = maximum === 0 ? 0 : (maximum - minimum) / maximum;
    const light = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    const row = Math.floor(pixelIndex / width);

    luminance[pixelIndex] = light;
    sum += light;
    sumSquares += light * light;
    if (light > 158 && saturation < 0.24) neutralLight += 1;
    if (light > 208 && saturation < 0.17) whitePaper += 1;
    if (saturation > 0.45) colorful += 1;
    if (light < 22) veryDark += 1;
    if (light > 248) veryLight += 1;
    if (light < 180) rowInk[row] += 1;

    const looksLikeSkin = red > 92
      && green > 38
      && blue > 20
      && red > green
      && red > blue
      && maximum - minimum > 18
      && Math.abs(red - green) > 12;
    if (looksLikeSkin) skin += 1;
  }

  const total = width * height;
  const mean = sum / total;
  const deviation = Math.sqrt(Math.max(0, sumSquares / total - mean * mean));
  let edgeCount = 0;
  let detailSum = 0;

  for (let y = 1; y < height; y += 1) {
    for (let x = 1; x < width; x += 1) {
      const index = y * width + x;
      const horizontal = Math.abs(luminance[index] - luminance[index - 1]);
      const vertical = Math.abs(luminance[index] - luminance[index - width]);
      const detail = horizontal + vertical;
      detailSum += detail;
      if (detail > 42) edgeCount += 1;
    }
  }

  let lineBands = 0;
  let inBand = false;
  for (const inkCount of rowInk) {
    const ratio = inkCount / width;
    const textLikeRow = ratio > 0.012 && ratio < 0.78;
    if (textLikeRow && !inBand) lineBands += 1;
    inBand = textLikeRow;
  }

  return {
    width: sourceWidth,
    height: sourceHeight,
    deviation,
    neutralLightRatio: neutralLight / total,
    whitePaperRatio: whitePaper / total,
    colorfulRatio: colorful / total,
    skinRatio: skin / total,
    veryDarkRatio: veryDark / total,
    veryLightRatio: veryLight / total,
    edgeDensity: edgeCount / Math.max(1, (width - 1) * (height - 1)),
    detailScore: detailSum / Math.max(1, (width - 1) * (height - 1)),
    lineBands,
    canvas,
  };
}

async function readVisibleText(canvas) {
  if (!('TextDetector' in window)) return '';

  try {
    const detector = new window.TextDetector();
    const blocks = await detector.detect(canvas);
    return blocks.map((block) => block.rawValue || '').join(' ').trim();
  } catch {
    return '';
  }
}

function collectMedicalSignals(text) {
  if (!text) return [];
  return MEDICAL_SIGNAL_PATTERNS
    .filter(({ pattern }) => pattern.test(text))
    .map(({ label }) => label);
}

function calculateDocumentScore(metrics) {
  let score = 0;
  if (metrics.neutralLightRatio >= 0.5) score += 0.25;
  else if (metrics.neutralLightRatio >= 0.28) score += 0.18;
  else if (metrics.neutralLightRatio >= 0.16) score += 0.08;

  if (metrics.whitePaperRatio >= 0.28) score += 0.1;
  else if (metrics.whitePaperRatio >= 0.12) score += 0.05;

  if (metrics.edgeDensity >= 0.01 && metrics.edgeDensity <= 0.42) score += 0.2;
  else if (metrics.edgeDensity >= 0.004) score += 0.1;

  if (metrics.lineBands >= 6) score += 0.2;
  else if (metrics.lineBands >= 3) score += 0.14;
  else if (metrics.lineBands >= 1) score += 0.06;

  if (metrics.deviation >= 16 && metrics.deviation <= 105) score += 0.12;
  else if (metrics.deviation >= 9) score += 0.06;

  const aspectRatio = metrics.width / metrics.height;
  if (aspectRatio >= 0.42 && aspectRatio <= 1.9) score += 0.08;

  if (metrics.colorfulRatio > 0.5) score -= 0.14;
  if (metrics.skinRatio > 0.25) score -= 0.2;
  return clamp(score);
}

function collectVisualSignals(metrics, documentScore) {
  const signals = [];
  if (documentScore >= 0.45) signals.push('Document-like layout');
  if (metrics.lineBands >= 3) signals.push('Text-line pattern');
  if (metrics.neutralLightRatio >= 0.24 || metrics.whitePaperRatio >= 0.14) signals.push('Paper or report background');
  if (metrics.edgeDensity >= 0.006 && metrics.detailScore >= 4) signals.push('Readable contrast');
  return uniqueSignals(signals);
}

function inferDocumentType(text, fileName, expectedType) {
  const searchable = `${text} ${fileName}`;
  if (LAB_TERMS.test(searchable)) return 'lab_report';
  if (PRESCRIPTION_TERMS.test(searchable)) return 'prescription';
  if (MEDICINE_TERMS.test(searchable)) return 'medicine_label';
  if (expectedType === 'medicine') return 'medicine_label';
  if (expectedType === 'report') return 'medical_report';
  return 'prescription';
}

function normalizeAiResult(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const confidence = Number(payload.confidence);
  const documentType = String(payload.documentType || 'unknown');
  if (typeof payload.isMedicalDocument !== 'boolean' || !Number.isFinite(confidence)) return null;
  if (!MEDICAL_DOCUMENT_TYPES.has(documentType)) return null;
  return {
    isMedicalDocument: payload.isMedicalDocument,
    documentType,
    confidence: clamp(confidence),
    medicalSignals: Array.isArray(payload.medicalSignals)
      ? uniqueSignals(payload.medicalSignals.filter((signal) => typeof signal === 'string').map((signal) => signal.slice(0, 80)))
      : [],
    reason: typeof payload.reason === 'string' ? payload.reason.slice(0, 220) : 'No validation reason was provided.',
  };
}

async function validateWithAiEndpoint(file, expectedType, signal) {
  const endpoint = import.meta.env.VITE_MEDICAL_VALIDATION_ENDPOINT?.trim();
  if (!endpoint) return null;

  try {
    const body = new FormData();
    body.append('image', file);
    body.append('expectedDocumentType', expectedType);
    const response = await fetch(endpoint, { method: 'POST', body, signal });
    if (!response.ok) throw new Error(`Validation service returned ${response.status}.`);
    const result = normalizeAiResult(await response.json());
    if (!result) return invalidResult('The medical document validator returned an invalid response. Please try another image.');

    const inferredType = result.documentType === 'unknown'
      ? inferDocumentType(result.medicalSignals.join(' '), file.name, expectedType)
      : result.documentType;

    if (result.isMedicalDocument && result.confidence >= 0.55 && result.medicalSignals.length >= 2) {
      return validResult(inferredType, result.confidence, result.reason, 'ai', result.medicalSignals);
    }

    if (result.confidence >= 0.4 || result.medicalSignals.length > 0 || result.isMedicalDocument) {
      return borderlineResult(inferredType, result.confidence, result.reason, 'ai', result.medicalSignals);
    }

    return invalidResult(result.reason, 'invalid_document', result.medicalSignals);
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    return invalidResult('Medical document validation is temporarily unavailable. Please try again.');
  }
}

function assessImageQuality(metrics) {
  if (Math.min(metrics.width, metrics.height) < MIN_IMAGE_EDGE || metrics.width * metrics.height < MIN_IMAGE_AREA) {
    return { error: invalidResult('The image resolution is too low. Please take a clearer, closer photo.'), warnings: [] };
  }

  const looksBlank = metrics.deviation < 5
    || (metrics.edgeDensity < 0.0015 && metrics.detailScore < 2.4)
    || metrics.veryDarkRatio > 0.992
    || metrics.veryLightRatio > 0.995;
  if (looksBlank) {
    return { error: invalidResult('The image appears blank or unreadable. Please upload a clear medical document.'), warnings: [] };
  }

  const severelyBlurred = metrics.detailScore < 3.4 && metrics.edgeDensity < 0.0045;
  if (severelyBlurred) {
    return { error: invalidResult('The image appears too blurred. Please retake it in good light and keep the document in focus.'), warnings: [] };
  }

  const warnings = [];
  if (Math.min(metrics.width, metrics.height) < 280) warnings.push('Low image resolution');
  if (metrics.detailScore < 6 || metrics.edgeDensity < 0.008) warnings.push('Some details may be unclear');
  return { error: null, warnings };
}

function classifyLocally({ file, expectedType, origin, visibleText, metrics, qualityWarnings }) {
  const normalizedFileName = file.name.replace(/[_.-]+/g, ' ');
  const medicalSignals = uniqueSignals([
    ...collectMedicalSignals(visibleText),
    ...collectMedicalSignals(normalizedFileName),
  ]);
  const searchable = `${visibleText} ${normalizedFileName}`;
  const documentType = inferDocumentType(visibleText, normalizedFileName, expectedType);
  const documentScore = calculateDocumentScore(metrics);
  const visualSignals = collectVisualSignals(metrics, documentScore);
  const clearlyUnrelatedName = CLEARLY_UNRELATED_FILE_TERMS.test(normalizedFileName);
  const screenshotName = SCREENSHOT_FILE_TERMS.test(normalizedFileName);
  const looksLikeUnrelatedPhoto = (metrics.skinRatio > 0.2 || metrics.colorfulRatio > 0.48)
    && documentScore < 0.42
    && visualSignals.length < 2;

  if (clearlyUnrelatedName && medicalSignals.length < 2) {
    return invalidResult('The selected image appears unrelated to a medical document.', 'invalid_document', medicalSignals, visualSignals);
  }

  if (screenshotName && medicalSignals.length === 0) {
    return invalidResult('The screenshot does not show reliable medical information.', 'invalid_document', medicalSignals, visualSignals);
  }

  if (looksLikeUnrelatedPhoto && medicalSignals.length === 0) {
    return invalidResult('The image appears to be a personal or unrelated photo.', 'invalid_document', medicalSignals, visualSignals);
  }

  const expectedTypeBonus = expectedType === 'medicine' || expectedType === 'report' ? 0.04 : 0.02;
  const warningPenalty = Math.min(0.1, qualityWarnings.length * 0.05);
  const confidence = clamp(
    0.22
      + medicalSignals.length * 0.17
      + documentScore * 0.34
      + Math.min(0.08, visualSignals.length * 0.02)
      + expectedTypeBonus
      + (origin === 'camera' ? 0.02 : 0)
      - warningPenalty,
    0,
    0.92,
  );

  const combinedEvidenceCount = medicalSignals.length + Math.min(2, visualSignals.length);
  const hasStrongCombinedEvidence = medicalSignals.length >= 1
    && combinedEvidenceCount >= 3
    && documentScore >= 0.5;

  if ((medicalSignals.length >= 2 || hasStrongCombinedEvidence) && confidence >= 0.55) {
    return validResult(
      documentType,
      confidence,
      `${combinedEvidenceCount} medical and document signals were found${visibleText ? ' in the visible document text' : ''}.`,
      'device',
      medicalSignals,
      visualSignals,
    );
  }

  const looksDocumentLike = documentScore >= 0.43 && visualSignals.length >= 2;
  const hasUsefulMedicalSignal = medicalSignals.length >= 1;
  if (hasUsefulMedicalSignal || looksDocumentLike || (origin === 'camera' && documentScore >= 0.36)) {
    const borderlineConfidence = clamp(
      hasUsefulMedicalSignal ? Math.max(0.46, confidence) : Math.max(0.41, confidence),
      0.4,
      0.54,
    );
    const reason = hasUsefulMedicalSignal
      ? 'Medical evidence was found, but the browser could not verify enough details automatically.'
      : 'The image has a medical-document layout, but its text could not be confirmed automatically.';
    return borderlineResult(documentType, borderlineConfidence, reason, 'device', medicalSignals, visualSignals);
  }

  return invalidResult(
    'The image does not contain enough medical or document evidence to continue safely.',
    'invalid_document',
    medicalSignals,
    visualSignals,
  );
}

export async function validateMedicalDocument(file, { expectedType = 'prescription', origin = 'upload', signal } = {}) {
  const basicError = validateFileBasics(file);
  if (basicError) return basicError;
  if (signal?.aborted) throw new DOMException('Validation cancelled.', 'AbortError');

  let image;
  try {
    image = await decodeImage(file);
  } catch {
    return invalidResult('The image could not be opened. Please choose a valid JPG, PNG, or WEBP image.', 'decode_error');
  }

  try {
    const metrics = inspectPixels(image);
    const quality = assessImageQuality(metrics);
    if (quality.error) return quality.error;
    if (signal?.aborted) throw new DOMException('Validation cancelled.', 'AbortError');

    const aiResult = await validateWithAiEndpoint(file, expectedType, signal);
    if (aiResult) return aiResult;

    const visibleText = await readVisibleText(metrics.canvas);
    return classifyLocally({
      file,
      expectedType,
      origin,
      visibleText,
      metrics,
      qualityWarnings: quality.warnings,
    });
  } finally {
    image.close?.();
  }
}
