import type { ReactNode } from "react";

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

export const ComingSoon = () => (
  <span className="settings-badge text-label-small">Coming soon</span>
);

interface SettingsSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

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
