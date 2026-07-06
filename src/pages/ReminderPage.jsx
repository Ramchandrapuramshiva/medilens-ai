import { AlarmClock, BellRing, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import SafetyBanner from '../components/SafetyBanner.jsx';
import { deleteReminder, getReminders, saveReminder, toggleReminder } from '../utils/storage.js';

const initialForm = {
  medicineName: '',
  dosage: '',
  time: '08:00',
  frequency: 'Daily',
  duration: '7 days',
};

function ReminderPage() {
  const [form, setForm] = useState(initialForm);
  const [reminders, setReminders] = useState(getReminders);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event) => {
    event.preventDefault();
    setReminders(saveReminder(form));
    setForm(initialForm);
  };
  const remove = (id) => setReminders(deleteReminder(id));
  const toggle = (id) => setReminders(toggleReminder(id));

  return (
    <div className="px-5 pb-24 pt-32 sm:px-6 sm:pt-36">
      <PageHeader eyebrow="Local Medicine Schedule" title="Simple reminders for the medicines you verify" description="Create reminder cards manually or add them from a prescription result. Reminders stay in this browser for now." />

      <div className="mx-auto mt-10 grid max-w-6xl gap-5 lg:grid-cols-[0.78fr_1.22fr]">
        <form className="premium-card rounded-[2rem] p-5 sm:p-6" onSubmit={submit}>
          <div className="flex items-center justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">New Reminder</p><h2 className="mt-2 text-xl font-semibold tracking-[-0.045em] text-white">Medicine details</h2></div><BellRing className="size-6 text-white/38" /></div>
          <div className="mt-6 space-y-4">
            <label className="block"><span className="text-xs font-medium text-white/46">Medicine name</span><input className="medical-input mt-2" value={form.medicineName} onChange={(event) => update('medicineName', event.target.value)} placeholder="e.g. Pantoprazole 40 mg" required /></label>
            <label className="block"><span className="text-xs font-medium text-white/46">Dosage</span><input className="medical-input mt-2" value={form.dosage} onChange={(event) => update('dosage', event.target.value)} placeholder="e.g. 1 tablet" required /></label>
            <div className="grid grid-cols-2 gap-3"><label className="block"><span className="text-xs font-medium text-white/46">Time</span><input className="medical-input mt-2" type="time" value={form.time} onChange={(event) => update('time', event.target.value)} required /></label><label className="block"><span className="text-xs font-medium text-white/46">Frequency</span><select className="medical-input mt-2" value={form.frequency} onChange={(event) => update('frequency', event.target.value)}><option>Daily</option><option>Twice daily</option><option>Three times daily</option><option>As directed</option></select></label></div>
            <label className="block"><span className="text-xs font-medium text-white/46">Duration</span><input className="medical-input mt-2" value={form.duration} onChange={(event) => update('duration', event.target.value)} placeholder="e.g. 5 days" required /></label>
          </div>
          <button className="glass-pill-solid mt-6 flex h-12 w-full items-center justify-center gap-2 text-sm font-semibold" type="submit"><Plus className="size-4" />Add reminder</button>
        </form>

        <section className="premium-card rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Saved Schedule</p><h2 className="mt-2 text-xl font-semibold tracking-[-0.045em] text-white">{reminders.length} reminder{reminders.length === 1 ? '' : 's'}</h2></div><AlarmClock className="size-6 text-white/38" /></div>
          {reminders.length ? (
            <div className="mt-6 space-y-3">
              {reminders.map((item) => (
                <article key={item.id} className={`rounded-[1.35rem] border p-4 transition ${item.active ? 'border-white/16 bg-white/[0.065]' : 'border-white/8 bg-white/[0.025] opacity-58'}`}>
                  <div className="flex items-start justify-between gap-4"><div><p className="text-lg font-semibold tracking-[-0.04em] text-white">{item.medicineName}</p><p className="mt-1 text-sm text-white/48">{item.dosage} · {item.duration}</p></div><div className="flex items-center gap-1"><button className="grid size-10 place-items-center rounded-full text-white/50 hover:bg-white/[0.07] hover:text-white" type="button" aria-label={item.active ? 'Pause reminder' : 'Activate reminder'} onClick={() => toggle(item.id)}>{item.active ? <ToggleRight className="size-5" /> : <ToggleLeft className="size-5" />}</button><button className="grid size-10 place-items-center rounded-full text-white/42 hover:bg-white/[0.07] hover:text-white" type="button" aria-label={`Delete reminder for ${item.medicineName}`} onClick={() => remove(item.id)}><Trash2 className="size-4" /></button></div></div>
                  <div className="mt-4 flex flex-wrap gap-2"><span className="glass-pill px-3 py-1.5 text-xs font-semibold text-white">{item.time}</span><span className="glass-pill px-3 py-1.5 text-xs text-white/62">{item.frequency}</span>{item.source ? <span className="glass-pill px-3 py-1.5 text-xs text-white/48">{item.source}</span> : null}</div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center text-center"><AlarmClock className="size-10 text-white/24" /><h3 className="mt-4 text-lg font-semibold text-white">No reminders yet</h3><p className="mt-2 max-w-sm text-sm leading-6 text-white/46">Add a verified medicine schedule here or create reminders from a prescription result.</p></div>
          )}
        </section>
      </div>
      <div className="mx-auto mt-5 max-w-6xl"><SafetyBanner compact /></div>
    </div>
  );
}

export default ReminderPage;
