function GoogleMark() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.35 12.22c0-.74-.07-1.45-.2-2.13H12v4.03h5.23a4.48 4.48 0 0 1-1.94 2.85v2.62h3.14c1.84-1.7 2.92-4.2 2.92-7.37Z" />
      <path d="M12 21.7c2.62 0 4.82-.87 6.43-2.36l-3.14-2.62c-.87.58-1.98.92-3.29.92-2.53 0-4.68-1.71-5.45-4.01H3.3v2.7A9.7 9.7 0 0 0 12 21.7Z" opacity=".82" />
      <path d="M6.55 13.63A5.83 5.83 0 0 1 6.25 12c0-.57.1-1.12.3-1.63v-2.7H3.3A9.7 9.7 0 0 0 2.3 12c0 1.57.38 3.06 1 4.33l3.25-2.7Z" opacity=".62" />
      <path d="M12 6.36c1.43 0 2.7.49 3.71 1.44l2.78-2.79A9.34 9.34 0 0 0 12 2.3a9.7 9.7 0 0 0-8.7 5.37l3.25 2.7c.77-2.3 2.92-4.01 5.45-4.01Z" opacity=".92" />
    </svg>
  );
}

function GoogleAuthButton({ disabled, onClick }) {
  return (
    <button
      className="glass-pill flex h-12 w-full items-center justify-center gap-3 text-sm font-semibold text-white transition hover:border-white/34 hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-45 lg:h-9 2xl:h-10"
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      <GoogleMark />
      Continue with Google
    </button>
  );
}

export default GoogleAuthButton;
