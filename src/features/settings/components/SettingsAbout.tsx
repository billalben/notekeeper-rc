import { useTranslation } from "react-i18next";
import { useUIStore } from "@/shared/stores/useUIStore";
import {
  SettingsGroup,
  SettingsRow,
} from "@/features/settings/components/SettingsSection";
import { Button } from "@/shared/ui/Button";

export const SettingsAbout = () => {
  const { t } = useTranslation();
  const closeSettings = useUIStore((state) => state.closeSettings);
  const openTour = useUIStore((state) => state.openTour);

  const startTour = () => {
    closeSettings();
    openTour();
  };

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

      <SettingsGroup title={t("settings.about.tourGroup")}>
        <SettingsRow
          title={t("settings.about.tourTitle")}
          description={t("settings.about.tourDesc")}
        >
          <Button variant="fill" onClick={startTour}>
            {t("settings.about.tourAction")}
          </Button>
        </SettingsRow>
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
