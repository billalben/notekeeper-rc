import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface SettingsGroupProps {
  title: string;
  children: ReactNode;
}

export const SettingsGroup = ({ title, children }: SettingsGroupProps) => (
  <section className="settings-group">
    <h3 className="settings-group-title text-label-large">{title}</h3>
    <div className="settings-group-body">{children}</div>
  </section>
);

interface SettingsRowProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export const SettingsRow = ({
  title,
  description,
  children,
}: SettingsRowProps) => (
  <div className="settings-row">
    <div className="settings-row-text">
      <span className="text-body-medium">{title}</span>
      {description && (
        <span className="settings-row-description text-body-small">
          {description}
        </span>
      )}
    </div>
    {children && <div className="settings-row-control">{children}</div>}
  </div>
);

export const ComingSoon = () => {
  const { t } = useTranslation();

  return (
    <span className="settings-badge text-label-small">
      {t("common.comingSoon")}
    </span>
  );
};

interface SettingsSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export interface SettingsSelectOption {
  value: string;
  label: string;
}

interface SettingsSelectProps {
  value: string;
  options: SettingsSelectOption[];
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}

/**
 * A native select whose width fits the currently selected option (rather than
 * the longest option). The hidden `::after` mirror sets the wrapper width from
 * the selected label; the select is absolutely positioned to fill it.
 */
export const SettingsSelect = ({
  value,
  options,
  onChange,
  label,
  disabled,
}: SettingsSelectProps) => {
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

export const SettingsSwitch = ({
  checked,
  onChange,
  label,
}: SettingsSwitchProps) => (
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
