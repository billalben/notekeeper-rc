import { useTranslation } from "react-i18next";
import { SettingsGroup } from "./SettingsSection";
import { StorageMeter } from "./StorageMeter";
import { BackupPanel } from "./data/BackupPanel";
import { DangerZone } from "./data/DangerZone";
import { PersistencePanel } from "./data/PersistencePanel";
import { TrashPanel } from "./data/TrashPanel";

export const SettingsData = () => {
  const { t } = useTranslation();

  return (
    <>
      <BackupPanel />

      <SettingsGroup title={t("settings.data.storageGroup")}>
        <StorageMeter />
        <PersistencePanel />
      </SettingsGroup>

      <TrashPanel />

      <DangerZone />
    </>
  );
};
