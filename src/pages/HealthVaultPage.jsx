import { FileChartColumn, FileScan, Pill, Search, Vault } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { getVaultItems, setLastResult } from '../utils/storage.js';

const filters = [
  { key: 'all', label: 'All' },
  { key: 'prescription', label: 'Prescriptions' },
  { key: 'medicine', label: 'Medicines' },
  { key: 'report', label: 'Reports' },
];

const typeMeta = {
  prescription: { label: 'Prescription', icon: FileScan },
  medicine: { label: 'Medicine', icon: Pill },
  report: { label: 'Medical Report', icon: FileChartColumn },
};

function HealthVaultPage() {
  const navigate = useNavigate();
  const [items] = useState(getVaultItems);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const visible = useMemo(() => items.filter((item) => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const medicineNames = Array.isArray(item.medicines) ? item.medicines.map((medicine) => medicine.name).join(' ') : '';
    const haystack = `${item.title} ${item.patient?.name ?? ''} ${item.hospital?.name ?? ''} ${medicineNames}`.toLowerCase();
    return matchesFilter && haystack.includes(query.toLowerCase());
  }), [filter, items, query]);

  const viewItem = (item) => { setLastResult(item); navigate('/results'); };

  return (
    <div className="px-5 pb-24 pt-32 sm:px-6 sm:pt-36">
      <PageHeader eyebrow="Local Health Vault" title="Your analyzed medical files, kept close" description="Saved results stay in this browser using localStorage for the current frontend prototype." />
      <div className="mx-auto mt-10 max-w-6xl">
        <div className="premium-card flex flex-col gap-4 rounded-[1.5rem] p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="glass-pill flex h-12 flex-1 items-center gap-3 px-4 sm:max-w-md">
            <Search className="size-4 text-white/38" />
            <input className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/34" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved analyses" />
          </label>
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => <button key={item.key} className={`rounded-full border px-4 py-2.5 text-sm transition ${filter === item.key ? 'border-white/36 bg-white/[0.13] text-white' : 'border-white/10 bg-white/[0.035] text-white/48 hover:text-white'}`} type="button" onClick={() => setFilter(item.key)}>{item.label}</button>)}
          </div>
        </div>

        {visible.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => {
              const meta = typeMeta[item.type] || typeMeta.prescription; const Icon = meta.icon;
              const primaryMedicine = item.medicines?.[0];
              const cardTitle = item.type === 'medicine' && primaryMedicine
                ? `${primaryMedicine.name} ${primaryMedicine.strength}`
                : item.patient?.name && item.patient.name !== 'Not clearly readable'
                  ? item.patient.name
                  : item.title;
              return <article key={item.id} className="premium-card flex min-h-64 flex-col rounded-[1.5rem] p-5"><div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-2xl border border-white/14 bg-white/[0.06]"><Icon className="size-5" /></span><span className="glass-pill px-3 py-1.5 text-xs text-white/58">{meta.label}</span></div><h2 className="mt-6 text-xl font-semibold tracking-[-0.045em] text-white">{cardTitle}</h2><p className="mt-2 text-sm text-white/42">Source-verified {new Date(item.analyzedAt).toLocaleDateString()}</p><button className="glass-pill mt-auto h-11 text-sm font-semibold text-white" type="button" onClick={() => viewItem(item)}>View verified details</button></article>;
            })}
          </div>
        ) : (
          <div className="premium-card mt-5 flex min-h-80 flex-col items-center justify-center rounded-[2rem] p-8 text-center"><Vault className="size-10 text-white/28" /><h2 className="mt-4 text-xl font-semibold text-white">No saved results found</h2><p className="mt-2 max-w-md text-sm leading-6 text-white/48">Analyze a prescription, medicine, or report and save it here for future reference.</p><Link className="glass-pill-solid mt-6 px-5 py-3 text-sm font-semibold" to="/analyze">Analyze a file</Link></div>
        )}
      </div>
    </div>
  );
}

export default HealthVaultPage;
