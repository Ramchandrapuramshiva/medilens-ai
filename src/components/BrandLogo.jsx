function BrandLogo({ className = '' }) {
  return (
    <img
      className={`block shrink-0 object-contain ${className}`}
      src="/medilens-logo.svg"
      alt=""
      aria-hidden="true"
      draggable="false"
    />
  );
}

export default BrandLogo;
