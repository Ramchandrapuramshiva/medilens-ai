function AuthFormField({ autoComplete, label, name, onChange, placeholder, type = 'text', value }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium tracking-[-0.01em] text-white/62 lg:mb-1.5">{label}</span>
      <input
        className="medical-input h-12 lg:h-9 lg:min-h-9 2xl:h-10 2xl:min-h-10"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
      />
    </label>
  );
}

export default AuthFormField;
