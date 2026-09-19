import { useEffect } from "react";
import { useStorageUsage } from "../../hooks/useStorageUsage";
import { toast } from "../../store/useToastStore";
import { formatBytes, STORAGE_WARNING_RATIO } from "../../utils/storage";

let hasWarnedStorageFull = false;

export const StorageMeter = () => {
  const { supported, bytes, quota, percent } = useStorageUsage();

  const isWarning = percent >= STORAGE_WARNING_RATIO * 100;

  useEffect(() => {
    if (!supported) return;

    if (isWarning && !hasWarnedStorageFull) {
      hasWarnedStorageFull = true;
      toast.error("Storage almost full", {
        description: "Free up space or export a backup soon.",
      });
    } else if (!isWarning) {
      hasWarnedStorageFull = false;
    }
  }, [supported, isWarning]);

  if (!supported) {
    return (
      <div className="storage-meter">
        <p className="storage-meter-unavailable text-body-small">
          Storage information isn't available in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className="storage-meter">
      <div className="storage-meter-header">
        <span className="text-body-medium">
          {formatBytes(bytes)} of ~{formatBytes(quota)}
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
        aria-label="Storage used"
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
        Estimated in UTF-8 bytes. The 5 MB quota is a common browser default,
        so the percentage is approximate.
      </p>
    </div>
  );
};
