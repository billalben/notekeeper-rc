import { useTranslation } from "react-i18next";
import { usePersistentStorage } from "@/features/settings/hooks/usePersistentStorage";
import { toast } from "@/shared/stores/useToastStore";
import { SettingsRow } from "../SettingsSection";

/** Persistent-storage status and request control for Settings → Data. */
export const PersistencePanel = () => {
  const { t } = useTranslation();
  const { supported, persisted, checked, request } = usePersistentStorage();

  const description = !supported
    ? t("settings.data.persistenceUnsupportedDesc")
    : persisted
      ? t("settings.data.persistenceEnabledDesc")
      : t("settings.data.persistenceDisabledDesc");

  const enable = async () => {
    const granted = await request();
    if (granted) toast.success(t("settings.data.persistenceGranted"));
    else toast.info(t("settings.data.persistenceDenied"));
  };

  return (
    <SettingsRow
      title={t("settings.data.persistenceTitle")}
      description={description}
    >
      {supported && !persisted && (
        <button
          className="btn text"
          type="button"
          disabled={!checked}
          onClick={enable}
        >
          <span className="text-label-large">
            {t("settings.data.persistenceEnable")}
          </span>
          <div className="state-layer" />
        </button>
      )}
      {supported && persisted && (
        <span className="text-label-large">
          {t("settings.data.persistenceOn")}
        </span>
      )}
    </SettingsRow>
  );
};
