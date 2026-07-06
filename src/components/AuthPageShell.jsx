import { motion } from 'framer-motion';
import { FileChartColumn, FileScan, ShieldCheck, Vault } from 'lucide-react';
import BrandLogo from './BrandLogo.jsx';

const featureHighlights = [
  {
    description: 'Extract medicines exactly from uploaded prescriptions.',
    icon: FileScan,
    label: 'OCR Prescription Reader',
  },
  {
    description: 'Understand reports without changing medical meaning.',
    icon: FileChartColumn,
    label: 'AI Medical Report Analyzer',
  },
  {
    description: 'Store analyses privately on your device.',
    icon: Vault,
    label: 'Secure Health Vault',
  },
];

function AuthPageShell({ eyebrow, title, description, children, footer }) {
  return (
    <section className="relative min-h-dvh w-full overflow-x-hidden px-4 pb-5 pt-28 sm:px-6 sm:pb-8 sm:pt-32 lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:px-10 lg:pb-0 lg:pt-0 xl:px-14">
      <div className="mx-auto grid w-full max-w-[90rem] gap-8 lg:h-dvh lg:grid-cols-[minmax(0,11fr)_minmax(26.25rem,9fr)] lg:items-stretch lg:gap-12 xl:gap-20">
        <motion.aside
          className="relative hidden min-h-0 lg:flex lg:flex-col lg:pb-12 lg:pt-28 xl:pb-14 xl:pt-32"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="max-w-2xl">
            <h2 className="text-gradient-white font-serif text-[clamp(3.5rem,4.6vw,4.5rem)] font-semibold leading-[0.9] tracking-[-0.055em]">
              MediLens AI
            </h2>
            <p className="mt-5 text-sm font-semibold tracking-[-0.01em] text-white/72 xl:text-[15px]">
              Understand your health with confidence.
            </p>
            <p className="mt-4 max-w-xl text-[17px] font-light leading-7 text-white/56">
              Read, analyze and organize prescriptions, reports and medicines using production-grade AI extraction.
            </p>
          </div>

          <div className="mt-auto grid max-w-xl gap-6 pb-2 xl:gap-7">
            {featureHighlights.map(({ description: featureDescription, icon: Icon, label }, index) => (
              <motion.div
                key={label}
                className="flex items-start gap-4"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + (index * 0.09), duration: 0.45 }}
              >
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center text-white/72">
                  <Icon aria-hidden="true" className="size-4" strokeWidth={1.7} />
                </span>
                <div>
                  <p className="text-sm font-semibold tracking-[-0.01em] text-white/82">{label}</p>
                  <p className="mt-1 text-[13px] font-light leading-5 text-white/46">{featureDescription}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.aside>

        <div className="flex min-h-0 items-center justify-center lg:h-dvh lg:pb-16 lg:pt-20">
          <motion.div
            className="my-auto w-full max-w-[29rem] lg:relative lg:max-w-[27.5rem]"
            initial={{ opacity: 0, y: 18, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="premium-card rounded-[2rem] p-5 sm:p-7 lg:p-3 2xl:p-5">
              <BrandLogo className="mx-auto size-11 lg:size-9" />
              <div className="mt-5 text-center lg:mt-2 2xl:mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/42">{eyebrow}</p>
                <h1 className="text-gradient-white mt-3 font-serif text-[clamp(2.55rem,10vw,4rem)] font-normal leading-[0.92] tracking-[-0.045em] lg:mt-2 lg:text-[2.45rem] 2xl:text-[2.65rem]">{title}</h1>
                <p className="mx-auto mt-3 max-w-sm text-sm font-light leading-6 text-white/58 lg:mt-1.5 lg:text-[13px] lg:leading-[1.125rem] 2xl:mt-2 2xl:leading-5">{description}</p>
              </div>

              <div className="mt-6 lg:mt-2 2xl:mt-3">{children}</div>

              <div className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] leading-5 text-white/38 lg:mt-1.5 2xl:mt-2">
                <ShieldCheck className="size-3.5 shrink-0" />
                Secure access powered by Supabase Auth
              </div>
            </div>

            {footer ? <div className="mt-4 text-center text-sm text-white/52 lg:absolute lg:inset-x-0 lg:top-full lg:mt-2 2xl:mt-3">{footer}</div> : null}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default AuthPageShell;
