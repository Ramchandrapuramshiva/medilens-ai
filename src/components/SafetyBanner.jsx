import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

function SafetyBanner({ compact = false }) {
  return (
    <div className={`premium-card flex flex-col gap-4 rounded-[1.45rem] ${compact ? 'p-5' : 'p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7'}`}>
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/16 bg-white/[0.07] text-white">
          <ShieldAlert className="size-5" strokeWidth={1.7} />
        </span>
        <div>
          <h3 className="text-base font-semibold tracking-[-0.035em] text-white">Medical safety comes first</h3>
          <p className="mt-1 max-w-3xl text-sm font-light leading-6 tracking-[-0.02em] text-white/58">
            MediLens AI is an assistance tool, not a doctor replacement. Do not start, stop, or change medicine without confirmation from a qualified doctor or pharmacist.
          </p>
        </div>
      </div>
      {!compact ? (
        <Link className="glass-pill shrink-0 px-5 py-3 text-center text-sm font-semibold text-white" to="/safety">
          Safety & privacy
        </Link>
      ) : null}
    </div>
  );
}

export default SafetyBanner;
