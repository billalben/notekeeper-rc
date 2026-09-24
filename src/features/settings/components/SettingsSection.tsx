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
