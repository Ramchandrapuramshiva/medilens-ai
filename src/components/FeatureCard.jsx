import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function FeatureCard({ icon: Icon, title, description, index, to }) {
  const card = (
    <motion.article
      className="premium-card group flex h-full min-h-[13.5rem] flex-col rounded-[1.45rem] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/[0.085]"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.48, delay: index * 0.035, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-6 grid size-11 place-items-center rounded-2xl border border-white/16 bg-white/[0.06] text-white shadow-inner shadow-white/10 transition group-hover:border-white/28 group-hover:bg-white/[0.1]">
        <Icon className="size-5" strokeWidth={1.65} />
      </div>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold leading-6 tracking-[-0.04em] text-white">{title}</h3>
        {to ? <ArrowUpRight className="mt-1 size-4 shrink-0 text-white/28 transition group-hover:text-white/70" /> : null}
      </div>
      <p className="mt-3 flex-1 text-sm font-light leading-6 tracking-[-0.025em] text-white/58">{description}</p>
    </motion.article>
  );

  return to ? <Link to={to}>{card}</Link> : card;
}

export default FeatureCard;
