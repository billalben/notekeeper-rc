interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export const Switch = ({ checked, onChange, label }: SwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    className={`settings-switch${checked ? " active" : ""}`}
    onClick={() => onChange(!checked)}
  >
    <span className="settings-switch-thumb" />
  </button>
);
