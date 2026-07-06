const VAULT_KEY = 'medilens-health-vault';
const REMINDERS_KEY = 'medilens-reminders';
const LAST_RESULT_KEY = 'medilens-last-result';

function readJson(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export function getVaultItems() {
  const items = readJson(VAULT_KEY, []);
  return Array.isArray(items) ? items.filter((item) => item?.sourceVerified === true) : [];
}

export function saveToVault(result) {
  const current = getVaultItems();
  if (result?.sourceVerified !== true) return current;
  const next = [result, ...current.filter((item) => item.id !== result.id)];
  return writeJson(VAULT_KEY, next);
}

export function setLastResult(result) {
  return writeJson(LAST_RESULT_KEY, result);
}

export function getLastResult() {
  const result = readJson(LAST_RESULT_KEY, null);
  return result?.sourceVerified === true ? result : null;
}

export function clearLastResult() {
  window.localStorage.removeItem(LAST_RESULT_KEY);
}

export function getReminders() {
  const items = readJson(REMINDERS_KEY, []);
  return Array.isArray(items) ? items.filter((item) => item?.source !== 'Prescription analysis' || item?.sourceVerified === true) : [];
}

export function saveReminder(reminder) {
  const current = getReminders();
  return writeJson(REMINDERS_KEY, [{ ...reminder, id: reminder.id ?? `reminder-${Date.now()}`, active: true }, ...current]);
}

export function deleteReminder(id) {
  const next = getReminders().filter((item) => item.id !== id);
  return writeJson(REMINDERS_KEY, next);
}

export function toggleReminder(id) {
  const next = getReminders().map((item) => (item.id === id ? { ...item, active: !item.active } : item));
  return writeJson(REMINDERS_KEY, next);
}

export function addPrescriptionReminders(result) {
  if (result?.type !== 'prescription' || result?.sourceVerified !== true || !Array.isArray(result.medicines)) return getReminders();

  const current = getReminders();
  const unreadable = 'Not clearly readable';
  const generated = result.medicines.flatMap((medicine, index) => {
    if (!medicine?.name || medicine.name === unreadable || !medicine.dosage || medicine.dosage === unreadable) return [];
    const slots = [
      { enabled: medicine.morning === true, label: 'Morning', time: '08:00' },
      { enabled: medicine.afternoon === true, label: 'Afternoon', time: '13:00' },
      { enabled: medicine.night === true, label: 'Night', time: '20:00' },
    ].filter((slot) => slot.enabled);

    return slots.map((slot) => ({
      id: `${result.id}-${index}-${slot.label.toLowerCase()}`,
      medicineName: [medicine.name, medicine.strength === unreadable ? '' : medicine.strength].filter(Boolean).join(' '),
      dosage: medicine.dosage,
      time: slot.time,
      frequency: medicine.frequency === unreadable ? slot.label : medicine.frequency,
      duration: medicine.duration,
      active: true,
      source: 'Source-verified OCR',
      sourceVerified: true,
    }));
  });

  const existingIds = new Set(current.map((item) => item.id));
  return writeJson(REMINDERS_KEY, [...generated.filter((item) => !existingIds.has(item.id)), ...current]);
}
