import { motion } from 'framer-motion';

function PageHeader({ eyebrow, title, description, children }) {
  return (
    <motion.header
      className="mx-auto flex max-w-4xl flex-col items-center text-center"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/46">{eyebrow}</p>
      <h1 className="mt-4 font-serif text-[clamp(3.1rem,7vw,7.2rem)] font-normal leading-[0.88] tracking-[-0.055em] text-gradient-white">
        {title}
      </h1>
      {description ? (
        <p className="mt-6 max-w-2xl text-base font-light leading-7 tracking-[-0.03em] text-white/62 sm:text-lg">{description}</p>
      ) : null}
      {children ? <div className="mt-7">{children}</div> : null}
    </motion.header>
  );
}

export default PageHeader;
