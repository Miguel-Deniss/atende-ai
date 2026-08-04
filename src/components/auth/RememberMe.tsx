interface RememberMeProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function RememberMe({ checked, onChange }: RememberMeProps) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span className="w-4 h-4 rounded border border-gray-600 bg-transparent flex items-center justify-center transition-all peer-checked:bg-blue-500 peer-checked:border-blue-500 peer-checked:shadow-lg peer-checked:shadow-blue-500/25 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background">
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className="opacity-0 peer-checked:opacity-100 transition-opacity"
        >
          <path d="M2 5.2L4.2 7.4L8 2.8" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
        Manter conectado
      </span>
    </label>
  );
}
