function AuthStatusMessage({ children, tone = 'neutral' }) {
  const role = tone === 'error' ? 'alert' : 'status';
  return (
    <div
      className="rounded-[1rem] border border-white/14 bg-white/[0.055] px-4 py-3 text-sm font-light leading-6 text-white/68 lg:px-3.5 lg:py-2 lg:text-[12px] lg:leading-5"
      role={role}
      aria-live="polite"
    >
      {children}
    </div>
  );
}

export default AuthStatusMessage;
