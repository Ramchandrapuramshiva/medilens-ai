import { Database, Eye, ShieldCheck, Stethoscope } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';

const principles = [
  { icon: Stethoscope, title: 'AI assistance, not medical care', text: 'MediLens AI organizes visible information from documents and medicine photos. It does not diagnose conditions or replace a qualified clinician.' },
  { icon: ShieldCheck, title: 'Confirm before taking action', text: 'Do not start, stop, change, or combine medicines based only on an AI result. Confirm names, strengths, schedules, and report interpretation with a doctor or pharmacist.' },
  { icon: Eye, title: 'Unclear text stays uncertain', text: 'Low-confidence or unreadable handwriting is flagged for verification. Missing information should never be treated as a safe instruction.' },
  { icon: Database, title: 'Private local prototype storage', text: 'Health Vault and reminder data are stored in localStorage in this browser for the frontend prototype. Clearing browser data removes it.' },
];

function SafetyPage() {
  return (
    <div className="px-5 pb-24 pt-32 sm:px-6 sm:pt-36">
      <PageHeader eyebrow="Safety & Privacy" title="Clear boundaries for responsible medical assistance" description="MediLens AI is designed to make medical text easier to review, while keeping clinical decisions with qualified professionals." />
      <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2">
        {principles.map((item) => { const Icon = item.icon; return <article key={item.title} className="premium-card min-h-64 rounded-[1.6rem] p-6"><span className="grid size-12 place-items-center rounded-2xl border border-white/16 bg-white/[0.07]"><Icon className="size-5" /></span><h2 className="mt-7 text-xl font-semibold tracking-[-0.045em] text-white">{item.title}</h2><p className="mt-3 text-sm font-light leading-6 tracking-[-0.02em] text-white/58">{item.text}</p></article>; })}
      </div>
      <div className="premium-card mx-auto mt-5 max-w-5xl rounded-[1.6rem] p-6 text-center sm:p-8"><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">Emergency guidance</p><p className="mx-auto mt-3 max-w-3xl text-base font-light leading-7 text-white/64">MediLens AI is not appropriate for emergencies. Contact local emergency services or a qualified medical professional when urgent help is needed.</p></div>
    </div>
  );
}

export default SafetyPage;
