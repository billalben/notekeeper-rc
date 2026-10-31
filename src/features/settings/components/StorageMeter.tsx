import { useTranslation } from "react-i18next";
import { useStorageUsage } from "@/features/statistics/hooks/useStorageUsage";
import { formatBytes, isStorageUsageWarning } from "@/shared/lib/storage";

export const StorageMeter = () => {
  const { t } = useTranslation();
  const { supported, bytes, quota, percent } = useStorageUsage();

  const isWarning = isStorageUsageWarning(percent);

  if (!supported) {
    return (
      <div className="storage-meter">
        <p className="storage-meter-unavailable text-body-small">
          {t("stats.storageUnavailable")}
        </p>
      </div>
    );
  }

  return (
    <div className="storage-meter">
      <div className="storage-meter-header">
        <span className="text-body-medium">
          {formatBytes(bytes)} / ~{formatBytes(quota)}
        </span>
        <span
          className={`text-label-large${
            isWarning ? " storage-meter-warning" : ""
          }`}
        >
          {percent.toFixed(1)}%
        </span>
      </div>

      <div
        className="storage-meter-bar"
        role="progressbar"
        aria-label={t("stats.storageUsed")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <div
          className={`storage-meter-fill${isWarning ? " warning" : ""}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>

      <p className="storage-meter-note text-body-small">
        {t("settings.data.storageNote")}
      </p>
    </div>
  );
};
