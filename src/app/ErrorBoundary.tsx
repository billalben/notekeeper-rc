import { useState, type ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import i18n from "@/app/i18n";
import { downloadBackupFile } from "@/shared/lib/export";
import { useNoteStore } from "@/shared/stores/useNoteStore";

interface ErrorBoundaryProps {
  children: ReactNode;
}

type ExportStatus = "idle" | "success" | "error";

const ErrorFallback = () => {
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");

  const exportBackup = () => {
    try {
      const { notebooks, tags } = useNoteStore.getState();
      downloadBackupFile(notebooks, tags);
      setExportStatus("success");
    } catch (error) {
      console.error("Backup export failed:", error);
      setExportStatus("error");
    }
  };

  return (
    <div className="app-error" role="alert">
      <div className="app-error-card">
        <span className="material-symbols-rounded app-error-icon" aria-hidden>
          error
        </span>
        <h1 className="text-headline-small">{i18n.t("errors.title")}</h1>
        <p className="text-body-medium">{i18n.t("errors.description")}</p>

        <div className="app-error-actions">
          <button
            className="btn fill"
            type="button"
            onClick={() => window.location.reload()}
          >
            <span className="text-label-large">{i18n.t("errors.reload")}</span>
            <div className="state-layer" />
          </button>
          <button className="btn text" type="button" onClick={exportBackup}>
            <span className="text-label-large">
              {i18n.t("errors.exportBackup")}
            </span>
            <div className="state-layer" />
          </button>
        </div>

        {exportStatus !== "idle" && (
          <p className="text-body-small app-error-status" role="status">
            {i18n.t(
              exportStatus === "success"
                ? "errors.exportSuccess"
                : "errors.exportFailed",
            )}
          </p>
        )}
      </div>
    </div>
  );
};

export const ErrorBoundary = ({ children }: ErrorBoundaryProps) => (
  <ReactErrorBoundary
    FallbackComponent={ErrorFallback}
    onError={(error, info) => {
      console.error("Unhandled render error:", error, info.componentStack);
    }}
  >
    {children}
  </ReactErrorBoundary>
);
