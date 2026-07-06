import { BellRing, FileChartColumn, FileScan, Pill, Vault } from 'lucide-react';
import FeatureCard from '../components/FeatureCard.jsx';
import Hero from '../components/Hero.jsx';
import SafetyBanner from '../components/SafetyBanner.jsx';

const features = [
  {
    icon: FileScan,
    title: 'Prescription Reader',
    description: 'Extract medicine names, dosage, timing, duration, food instructions, and handwriting confidence.',
    to: '/analyze?type=prescription',
  },
  {
    icon: Pill,
    title: 'Medicine Identifier',
    description: 'Analyze medicine strip or tablet photos for name, strength, common use, and safety verification.',
    to: '/analyze?type=medicine',
  },
  {
    icon: FileChartColumn,
    title: 'Report Explainer',
    description: 'Organize report values as normal, high, or low with simple, non-diagnostic explanations.',
    to: '/analyze?type=report',
  },
  {
    icon: Vault,
    title: 'Health Vault',
    description: 'Save analyzed prescriptions, medicines, and reports locally for quick private access.',
    to: '/vault',
  },
  {
    icon: BellRing,
    title: 'Medicine Reminder',
    description: 'Create local reminder cards with dosage, time, frequency, and duration from analyzed results.',
    to: '/reminders',
  },
];

function LandingPage() {
  return (
    <>
      <Hero />
      <section className="deferred-section relative px-5 pb-16 pt-5 sm:px-6 lg:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center sm:mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/46">Clearer Medical Information</p>
            <h2 className="mx-auto mt-4 max-w-3xl font-serif text-[clamp(2.8rem,6vw,6rem)] font-normal leading-[0.9] tracking-[-0.05em] text-gradient-white">
              One calm workspace for documents, medicines, and reminders
            </h2>
          </div>
          <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
          <div className="mt-6">
            <SafetyBanner />
          </div>
        </div>
      </section>
    </>
  );
}

export default LandingPage;
