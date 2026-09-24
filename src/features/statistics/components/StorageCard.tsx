import { useTranslation } from "react-i18next";
import { formatBytes } from "@/shared/lib/storage";
import { useStorageUsage } from "../hooks/useStorageUsage";
import { StatCard } from "./StatCard";

export const StorageCard = () => {
  const { t } = useTranslation();
  const { supported, bytes, quota, percent } = useStorageUsage();

  return (
    <StatCard span={12} title={t("stats.storage")} className="stats-storage">
      {supported ? (
        <div className="stats-storage-body">
          <span className="stats-big-number text-display-small">
            {formatBytes(bytes)}
          </span>
          <div className="stats-storage-right">
            <div
              className={`storage-thin-bar${percent >= 80 ? " warning" : ""}`}
              role="progressbar"
              aria-label={t("stats.storageUsed")}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(percent)}
            >
              <div
                className="storage-thin-fill"
                style={{ width: `${Math.min(100, percent)}%` }}
              />
            </div>
            <div className="stats-storage-meta text-body-small">
              <span>
                {t("stats.percentUsed", { percent: percent.toFixed(1) })}
              </span>
              <span>
                {t("stats.browserLimit", { size: formatBytes(quota) })}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="stats-card-subtitle text-body-small">
          {t("stats.storageUnavailable")}
        </p>
      )}
    </StatCard>
  );
};
