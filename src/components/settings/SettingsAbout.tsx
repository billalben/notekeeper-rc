import { useTranslation } from "react-i18next";
import { SettingsGroup, SettingsRow } from "./SettingsSection";

export const SettingsAbout = () => {
  const { t } = useTranslation();

  return (
    <>
      <SettingsGroup title={t("settings.about.aboutGroup")}>
        <SettingsRow
          title={t("settings.about.notekeeperTitle")}
          description={t("settings.about.notekeeperDesc")}
        />
        <SettingsRow
          title={t("settings.about.storageTitle")}
          description={t("settings.about.storageDesc")}
        />
      </SettingsGroup>

      <SettingsGroup title={t("settings.about.creditsGroup")}>
        <SettingsRow
          title={t("settings.about.madeByTitle")}
          description={t("settings.about.madeByDesc")}
        />
        <SettingsRow
          title={t("settings.about.copyrightTitle")}
          description={t("settings.about.copyrightDesc", {
            year: new Date().getFullYear(),
          })}
        />
      </SettingsGroup>
    </>
  );
};
