interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}

/**
 * A native select whose width fits the currently selected option (rather than
 * the longest option). The hidden `::after` mirror sets the wrapper width from
 * the selected label; the select is absolutely positioned to fill it.
 */
export const Select = ({
  value,
  options,
  onChange,
  label,
  disabled,
}: SelectProps) => {
  const selected = options.find((option) => option.value === value);

  return (
    <span className="settings-select-wrap" data-value={selected?.label ?? ""}>
      <select
        className="settings-select"
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </span>
  );
};
