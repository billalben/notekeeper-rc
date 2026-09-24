import { useState } from "react";
import { useTranslation } from "react-i18next";
import { downloadBackupFile, downloadNotebookFile } from "@/shared/lib/export";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import {
  useSettingsStore,
  type ExportFormat,
} from "@/shared/stores/useSettingsStore";
import { toast } from "@/shared/stores/useToastStore";
import { Select } from "@/shared/ui/Select";
import { ComingSoon, SettingsGroup, SettingsRow } from "../SettingsSection";

export const BackupPanel = () => {
  const { t } = useTranslation();
  const notebooks = useNoteStore((state) => state.notebooks);
  const tags = useNoteStore((state) => state.tags);
  const exportFormat = useSettingsStore((state) => state.export.defaultFormat);
  const setExportSettings = useSettingsStore(
    (state) => state.setExportSettings,
  );

  const [exportNotebookId, setExportNotebookId] = useState("");

  const visibleNotebooks = notebooks.filter(
    (notebook) => notebook.deletedAt === null,
  );
  const selectedExportId = visibleNotebooks.some(
    (notebook) => notebook.id === exportNotebookId,
  )
    ? exportNotebookId
    : (visibleNotebooks[0]?.id ?? "");

  const exportAll = () => {
    if (visibleNotebooks.length === 0) return;

    try {
      downloadBackupFile(notebooks, tags);
    } catch {
      toast.error(t("toasts.exportDataFailed"));
    }
  };

  const exportNotebook = () => {
    const notebook = visibleNotebooks.find(
      (item) => item.id === selectedExportId,
    );
    if (!notebook) return;

    try {
      downloadNotebookFile(notebook, exportFormat);
    } catch {
      toast.error(t("toasts.exportNotebookFailed"));
    }
  };

  return (
    <SettingsGroup title={t("settings.data.backupGroup")}>
      <SettingsRow
        title={t("settings.data.exportFormatTitle")}
        description={t("settings.data.exportFormatDesc")}
      >
        <Select
          label={t("settings.data.exportFormatLabel")}
          value={exportFormat}
          options={[
            { value: "json", label: t("card.json") },
            { value: "md", label: t("card.markdown") },
          ]}
          onChange={(value) =>
            setExportSettings({ defaultFormat: value as ExportFormat })
          }
        />
      </SettingsRow>
      <SettingsRow
        title={t("settings.data.exportAllTitle")}
        description={t("settings.data.exportAllDesc")}
      >
        <button
          className="btn fill"
          type="button"
          disabled={visibleNotebooks.length === 0}
          onClick={exportAll}
        >
          <span className="text-label-large">
            {t("settings.data.exportAll")}
          </span>
          <div className="state-layer" />
        </button>
      </SettingsRow>
      <SettingsRow
        title={t("settings.data.exportNotebookTitle")}
        description={t("settings.data.exportNotebookDesc", {
          format: exportFormat === "md" ? t("card.markdown") : t("card.json"),
        })}
      >
        <div className="settings-export-controls">
          <Select
            label={t("settings.data.notebookToExportLabel")}
            value={selectedExportId}
            disabled={visibleNotebooks.length === 0}
            options={visibleNotebooks.map((notebook) => ({
              value: notebook.id,
              label: notebook.name,
            }))}
            onChange={setExportNotebookId}
          />
          <button
            className="btn text"
            type="button"
            disabled={!selectedExportId}
            onClick={exportNotebook}
          >
            <span className="text-label-large">
              {t("settings.data.export")}
            </span>
            <div className="state-layer" />
          </button>
        </div>
      </SettingsRow>
      <SettingsRow
        title={t("settings.data.importTitle")}
        description={t("settings.data.importDesc")}
      >
        <ComingSoon />
      </SettingsRow>
    </SettingsGroup>
  );
};
