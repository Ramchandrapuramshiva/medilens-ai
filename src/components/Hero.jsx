import { motion } from 'framer-motion';
import { ArrowRight, FileScan, Pill, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const signals = [
  { label: 'Prescription Reader', className: 'left-[7%] top-[39%]', delay: 0 },
  { label: 'Medicine Identifier', className: 'right-[8%] top-[36%]', delay: 0.8 },
  { label: 'Confidence Scores', className: 'bottom-[23%] left-[10%]', delay: 1.35 },
  { label: 'Private Health Vault', className: 'bottom-[24%] right-[11%]', delay: 0.45 },
];

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-dvh items-center justify-center px-5 pb-12 pt-28 sm:px-6 sm:pt-32">
      <div className="pointer-events-none absolute inset-0 hidden xl:block">
        {signals.map((signal) => (
          <motion.div
            key={signal.label}
            className={`floating-pill absolute ${signal.className}`}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: [0, -12, 0], scale: 1 }}
            transition={{
              opacity: { duration: 0.8, delay: 0.6 + signal.delay },
              scale: { duration: 0.8, delay: 0.6 + signal.delay },
              y: { duration: 5.6, repeat: Infinity, ease: 'easeInOut', delay: signal.delay },
            }}
          >
            {signal.label}
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mx-auto flex w-full max-w-6xl flex-col items-center text-center"
        initial={{ opacity: 0, y: 16, scale: 0.992 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.72, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55 sm:text-xs sm:tracking-[0.28em]">
          MEDILENS AI · MEDICAL DOCUMENT ASSISTANT
        </p>
        <h1 className="hero-headline">
          Understand prescriptions, medicines and reports with AI
        </h1>
        <p className="mt-7 max-w-2xl px-1 text-balance text-base font-light leading-7 tracking-[-0.025em] text-white/68 sm:text-lg">
          Upload a medical document or medicine photo and turn difficult text into clear, structured information you can verify.
        </p>

        <div className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            className="glass-pill-solid group flex h-14 items-center justify-center gap-3 px-6 text-sm font-semibold tracking-[-0.02em] transition hover:scale-[1.02]"
            type="button"
            onClick={() => navigate('/analyze?type=prescription')}
          >
            <FileScan className="size-4" />
            Upload prescription
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </button>
          <button
            className="glass-pill flex h-14 items-center justify-center gap-3 px-6 text-sm font-semibold tracking-[-0.02em] text-white transition hover:border-white/34 hover:bg-white/[0.12]"
            type="button"
            onClick={() => navigate('/analyze?type=medicine')}
          >
            <Pill className="size-4" />
            Analyze medicine
          </button>
        </div>

        <div className="mt-7 flex items-center gap-2 text-xs font-medium tracking-[-0.015em] text-white/44">
          <ShieldCheck className="size-4" />
          AI assistance only. Always verify with a doctor or pharmacist.
        </div>
      </motion.div>
    </section>
  );
}

export default Hero;
