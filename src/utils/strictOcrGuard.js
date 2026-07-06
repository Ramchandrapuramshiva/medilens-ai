export const UNREADABLE = 'Not clearly readable';

const normalizeText = (value) => String(value ?? '')
  .normalize('NFKC')
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const cleanString = (value) => {
  const cleaned = typeof value === 'string' ? value.trim() : '';
  return cleaned || UNREADABLE;
};

const isUnreadable = (value) => normalizeText(value) === normalizeText(UNREADABLE);

export function createUnreadableExtraction() {
  return {
    hospital: { name: UNREADABLE, address: UNREADABLE },
    doctor: { name: UNREADABLE, qualification: UNREADABLE, registrationNo: UNREADABLE },
    patient: { name: UNREADABLE, age: UNREADABLE, gender: UNREADABLE },
    date: UNREADABLE,
    medicines: [],
    advice: UNREADABLE,
    doctorSignatureDetected: UNREADABLE,
    confidence: 0,
  };
}

function isTextSupported(value, normalizedOcr) {
  if (isUnreadable(value)) return false;
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return false;
  if (normalizedValue.length <= 3) return normalizedOcr.split(' ').includes(normalizedValue);
  return normalizedOcr.includes(normalizedValue);
}

function scheduleIsSupported(period, rawOcrText) {
  const text = String(rawOcrText || '').toLowerCase();
  const threeTimesDaily = /\b(?:tds|t\.?\s*d\.?\s*s\.?)\b/i.test(text)
    || /\b1\s*[-/]\s*1\s*[-/]\s*1\b/.test(text);
  if (threeTimesDaily) return true;

  if (period === 'morning') return /\b(?:morning|breakfast|a\.?m\.?)\b/i.test(text);
  if (period === 'afternoon') return /\b(?:afternoon|noon|lunch)\b/i.test(text);
  return /\b(?:night|bedtime|dinner|h\.?s\.?)\b/i.test(text);
}

function createAudit() {
  return {
    checkedFields: 0,
    verifiedFields: 0,
    rejectedFields: [],
    rejectedMedicines: [],
  };
}

function verifyString(value, path, normalizedOcr, audit) {
  const cleaned = cleanString(value);
  audit.checkedFields += 1;
  if (isTextSupported(cleaned, normalizedOcr)) {
    audit.verifiedFields += 1;
    return cleaned;
  }
  if (!isUnreadable(cleaned)) audit.rejectedFields.push(path);
  return UNREADABLE;
}

function verifySchedule(value, period, path, rawOcrText, audit) {
  if (value !== true) return false;
  audit.checkedFields += 1;
  if (scheduleIsSupported(period, rawOcrText)) {
    audit.verifiedFields += 1;
    return true;
  }
  audit.rejectedFields.push(path);
  return false;
}

function verifySignature(value, rawOcrText, audit) {
  const requested = cleanString(value);
  audit.checkedFields += 1;
  if (requested === 'Yes' && /\b(?:signature|signed)\b/i.test(rawOcrText)) {
    audit.verifiedFields += 1;
    return 'Yes';
  }
  if (requested === 'No' && /\b(?:no\s+signature|unsigned)\b/i.test(rawOcrText)) {
    audit.verifiedFields += 1;
    return 'No';
  }
  if (!isUnreadable(requested)) audit.rejectedFields.push('doctorSignatureDetected');
  return UNREADABLE;
}

function verifyMedicine(medicine, index, normalizedOcr, rawOcrText, audit) {
  const name = cleanString(medicine?.name);
  audit.checkedFields += 1;
  if (!isTextSupported(name, normalizedOcr)) {
    if (!isUnreadable(name)) audit.rejectedMedicines.push(name);
    return null;
  }
  audit.verifiedFields += 1;

  return {
    name,
    strength: verifyString(medicine?.strength, `medicines.${index}.strength`, normalizedOcr, audit),
    dosage: verifyString(medicine?.dosage, `medicines.${index}.dosage`, normalizedOcr, audit),
    frequency: verifyString(medicine?.frequency, `medicines.${index}.frequency`, normalizedOcr, audit),
    morning: verifySchedule(medicine?.morning, 'morning', `medicines.${index}.morning`, rawOcrText, audit),
    afternoon: verifySchedule(medicine?.afternoon, 'afternoon', `medicines.${index}.afternoon`, rawOcrText, audit),
    night: verifySchedule(medicine?.night, 'night', `medicines.${index}.night`, rawOcrText, audit),
    foodTiming: verifyString(medicine?.foodTiming, `medicines.${index}.foodTiming`, normalizedOcr, audit),
    duration: verifyString(medicine?.duration, `medicines.${index}.duration`, normalizedOcr, audit),
    notes: verifyString(medicine?.notes, `medicines.${index}.notes`, normalizedOcr, audit),
  };
}

export function verifyExtractionAgainstOcr(rawOcrText, candidate) {
  const rawText = typeof rawOcrText === 'string' ? rawOcrText.trim() : '';
  const normalizedOcr = normalizeText(rawText);
  const audit = createAudit();
  if (!normalizedOcr) return { extraction: createUnreadableExtraction(), audit };

  const source = candidate && typeof candidate === 'object' ? candidate : createUnreadableExtraction();
  const medicines = Array.isArray(source.medicines)
    ? source.medicines
      .map((medicine, index) => verifyMedicine(medicine, index, normalizedOcr, rawText, audit))
      .filter(Boolean)
    : [];

  const extraction = {
    hospital: {
      name: verifyString(source.hospital?.name, 'hospital.name', normalizedOcr, audit),
      address: verifyString(source.hospital?.address, 'hospital.address', normalizedOcr, audit),
    },
    doctor: {
      name: verifyString(source.doctor?.name, 'doctor.name', normalizedOcr, audit),
      qualification: verifyString(source.doctor?.qualification, 'doctor.qualification', normalizedOcr, audit),
      registrationNo: verifyString(source.doctor?.registrationNo, 'doctor.registrationNo', normalizedOcr, audit),
    },
    patient: {
      name: verifyString(source.patient?.name, 'patient.name', normalizedOcr, audit),
      age: verifyString(source.patient?.age, 'patient.age', normalizedOcr, audit),
      gender: verifyString(source.patient?.gender, 'patient.gender', normalizedOcr, audit),
    },
    date: verifyString(source.date, 'date', normalizedOcr, audit),
    medicines,
    advice: verifyString(source.advice, 'advice', normalizedOcr, audit),
    doctorSignatureDetected: verifySignature(source.doctorSignatureDetected, rawText, audit),
    confidence: 0,
  };

  const reportedConfidence = Number(source.confidence);
  const supportRatio = audit.checkedFields > 0 ? audit.verifiedFields / audit.checkedFields : 0;
  extraction.confidence = Math.min(
    Number.isFinite(reportedConfidence) ? Math.max(0, Math.min(1, reportedConfidence)) : 0,
    supportRatio,
  );

  return { extraction, audit };
}
