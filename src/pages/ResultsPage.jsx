import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BadgeCheck,
  BellPlus,
  Building2,
  CalendarDays,
  Check,
  ClipboardList,
  FileCheck2,
  FileText,
  Pill,
  Save,
  ShieldAlert,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import SafetyBanner from '../components/SafetyBanner.jsx';
import { UNREADABLE } from '../utils/strictOcrGuard.js';
import { addPrescriptionReminders, getLastResult, saveToVault } from '../utils/storage.js';

const isUnreadable = (value) => !value || value === UNREADABLE;

function Field({ label, value }) {
  const unreadable = isUnreadable(value);
  return (
    <div className={`rounded-[1.1rem] border p-4 ${unreadable ? 'border-amber-200/18 bg-amber-100/[0.055]' : 'border-white/10 bg-white/[0.04]'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/36">{label}</p>
      <p className={`mt-2 text-sm font-semibold leading-6 ${unreadable ? 'text-amber-100/78' : 'text-white'}`}>{unreadable ? UNREADABLE : value}</p>
    </div>
  );
}

function SectionCard({ icon: Icon, eyebrow, title, children, className = '' }) {
  return (
    <section className={`premium-card rounded-[1.7rem] p-5 sm:p-6 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/14 bg-white/[0.06]"><Icon className="size-5 text-white/56" /></span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/36">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-white">{title}</h2>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ScheduleValue({ label, active }) {
  return (
    <div className={`rounded-[1rem] border p-3 text-center ${active ? 'border-emerald-200/18 bg-emerald-100/[0.07]' : 'border-white/9 bg-white/[0.025]'}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/36">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${active ? 'text-emerald-100' : 'text-white/42'}`}>{active ? 'Yes' : 'No'}</p>
    </div>
  );
}

function MedicineCard({ medicine, index }) {
  return (
    <motion.article
      className="premium-card rounded-[1.65rem] p-5 sm:p-6"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: index * 0.06 }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/36">Source-verified medicine {index + 1}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-white">
            {medicine.name} <span className={isUnreadable(medicine.strength) ? 'text-amber-100/70' : 'font-light text-white/56'}>{medicine.strength}</span>
          </h3>
        </div>
        <span className={`w-fit rounded-full border px-3 py-2 text-xs font-semibold ${isUnreadable(medicine.duration) ? 'border-amber-200/16 bg-amber-100/[0.055] text-amber-100/72' : 'border-white/14 bg-white/[0.055] text-white/68'}`}>{medicine.duration}</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Dosage" value={medicine.dosage} />
        <Field label="Frequency" value={medicine.frequency} />
        <Field label="Food timing" value={medicine.foodTiming} />
        <Field label="Duration" value={medicine.duration} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <ScheduleValue label="Morning" active={medicine.morning === true} />
        <ScheduleValue label="Afternoon" active={medicine.afternoon === true} />
        <ScheduleValue label="Night" active={medicine.night === true} />
      </div>

      <div className="mt-3"><Field label="Special notes" value={medicine.notes} /></div>
    </motion.article>
  );
}

function ConfidenceCard({ result }) {
  const percent = Math.round(Math.max(0, Math.min(1, Number(result.confidence) || 0)) * 100);
  const checked = result.audit?.checkedFields || 0;
  const verified = result.audit?.verifiedFields || 0;
  const rejected = (result.audit?.rejectedFields?.length || 0) + (result.audit?.rejectedMedicines?.length || 0);

  return (
    <SectionCard icon={BadgeCheck} eyebrow="Quality Control" title="Source confidence">
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-5xl font-semibold tracking-[-0.06em] text-white">{percent}%</p><p className="mt-2 text-xs text-white/42">Capped by OCR support and field verification</p></div>
        <span className="glass-pill px-3 py-2 text-xs font-semibold text-emerald-100">OCR checked</span>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-gradient-to-r from-white/42 to-white" style={{ width: `${percent}%` }} /></div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-[1rem] border border-white/10 bg-white/[0.035] p-3"><p className="text-lg font-semibold text-white">{checked}</p><p className="text-[10px] uppercase tracking-[0.14em] text-white/34">Checked</p></div>
        <div className="rounded-[1rem] border border-emerald-200/14 bg-emerald-100/[0.05] p-3"><p className="text-lg font-semibold text-emerald-100">{verified}</p><p className="text-[10px] uppercase tracking-[0.14em] text-white/34">Verified</p></div>
        <div className="rounded-[1rem] border border-amber-200/14 bg-amber-100/[0.05] p-3"><p className="text-lg font-semibold text-amber-100">{rejected}</p><p className="text-[10px] uppercase tracking-[0.14em] text-white/34">Removed</p></div>
      </div>
    </SectionCard>
  );
}

function EmptyResults() {
  const navigate = useNavigate();
  return (
    <div className="px-5 pb-24 pt-32 sm:px-6 sm:pt-36">
      <PageHeader eyebrow="No Verified Source" title="No source-verified analysis is available" description="MediLens will not display example medicines or inferred patient data. Upload a document and complete OCR extraction first.">
        <button className="glass-pill-solid h-12 px-6 text-sm font-semibold" type="button" onClick={() => navigate('/analyze')}>Analyze a document</button>
      </PageHeader>
      <div className="mx-auto mt-8 max-w-3xl"><SafetyBanner compact /></div>
    </div>
  );
}

function ResultsPage() {
  const navigate = useNavigate();
  const [result] = useState(getLastResult);
  const [message, setMessage] = useState('');

  if (!result) return <EmptyResults />;

  const hasReminderSchedule = result.type === 'prescription'
    && result.medicines.some((medicine) => medicine.morning || medicine.afternoon || medicine.night);
  const save = () => { saveToVault(result); setMessage('Source-verified result saved to Health Vault'); };
  const reminders = () => { addPrescriptionReminders(result); setMessage('Only explicit medicine times were added'); };

  return (
    <div className="px-5 pb-24 pt-32 sm:px-6 sm:pt-36">
      <PageHeader eyebrow="OCR + Source Verification Complete" title={result.title} description="Every displayed field was checked against the raw OCR text. Anything unsupported is marked “Not clearly readable” or removed.">
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button className="glass-pill-solid flex h-12 items-center gap-2 px-5 text-sm font-semibold" type="button" onClick={save}><Save className="size-4" />Save to Health Vault</button>
          {hasReminderSchedule ? <button className="glass-pill flex h-12 items-center gap-2 px-5 text-sm font-semibold text-white" type="button" onClick={reminders}><BellPlus className="size-4" />Add explicit reminders</button> : null}
          <button className="glass-pill h-12 px-5 text-sm font-semibold text-white" type="button" onClick={() => navigate('/analyze')}>Analyze another</button>
        </div>
      </PageHeader>

      {message ? <div className="mx-auto mt-6 flex max-w-lg items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[0.06] px-4 py-3 text-center text-sm text-white"><Check className="size-4 shrink-0" />{message}</div> : null}

      <div className="mx-auto mt-10 grid max-w-6xl gap-5 lg:grid-cols-2">
        <SectionCard icon={Building2} eyebrow="Source Section" title="Hospital Information">
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Hospital name" value={result.hospital.name} /><Field label="Hospital address" value={result.hospital.address} /></div>
        </SectionCard>

        <SectionCard icon={Stethoscope} eyebrow="Source Section" title="Doctor Information">
          <div className="grid gap-3 sm:grid-cols-3"><Field label="Doctor name" value={result.doctor.name} /><Field label="Qualification" value={result.doctor.qualification} /><Field label="Registration number" value={result.doctor.registrationNo} /></div>
        </SectionCard>

        <SectionCard icon={UserRound} eyebrow="Source Section" title="Patient Information">
          <div className="grid gap-3 sm:grid-cols-3"><Field label="Patient name" value={result.patient.name} /><Field label="Age" value={result.patient.age} /><Field label="Gender" value={result.patient.gender} /></div>
        </SectionCard>

        <SectionCard icon={CalendarDays} eyebrow="Source Section" title="Prescription Details">
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Document date" value={result.date} /><Field label="Doctor signature detected" value={result.doctorSignatureDetected} /><Field label="Source file" value={result.sourceFileName} /><Field label="Pipeline" value="OCR first · source verified" /></div>
        </SectionCard>
      </div>

      <div className="mx-auto mt-5 max-w-6xl">
        <SectionCard icon={Pill} eyebrow="Strict Extraction" title="Detected Medicines">
          {result.medicines.length ? (
            <div className="space-y-4">{result.medicines.map((medicine, index) => <MedicineCard key={`${medicine.name}-${index}`} medicine={medicine} index={index} />)}</div>
          ) : (
            <div className="flex items-start gap-3 rounded-[1.2rem] border border-amber-200/18 bg-amber-100/[0.055] p-4 text-sm leading-6 text-amber-100/78"><AlertTriangle className="mt-0.5 size-5 shrink-0" />No medicine name was verified in the OCR text. MediLens did not guess or substitute one.</div>
          )}
        </SectionCard>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <SectionCard icon={ClipboardList} eyebrow="Source Section" title="Doctor Advice"><Field label="Advice exactly from OCR" value={result.advice} /></SectionCard>
          <ConfidenceCard result={result} />
        </div>

        <details className="premium-card mt-5 rounded-[1.55rem] p-5 sm:p-6">
          <summary className="flex cursor-pointer list-none items-center gap-3 text-sm font-semibold text-white"><FileText className="size-5 text-white/46" />Raw OCR transcription</summary>
          <p className="mt-3 text-xs leading-5 text-white/42">This is the source used to verify every displayed value.</p>
          <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-[1.1rem] border border-white/10 bg-black/30 p-4 font-mono text-xs leading-6 text-white/66">{result.rawOcrText}</pre>
        </details>

        <div className="mt-5 flex items-start gap-3 rounded-[1.25rem] border border-white/14 bg-white/[0.055] p-4 text-sm font-light leading-6 text-white/64">
          <FileCheck2 className="mt-0.5 size-5 shrink-0 text-white/48" />{result.warning}
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-[1.25rem] border border-white/14 bg-white/[0.045] p-4 text-sm leading-6 text-white/58"><ShieldAlert className="mt-0.5 size-5 shrink-0" />Verify the OCR transcription and all medicine details with the prescribing doctor or a pharmacist before acting.</div>
        <div className="mt-5"><SafetyBanner compact /></div>
      </div>
    </div>
  );
}

export default ResultsPage;

