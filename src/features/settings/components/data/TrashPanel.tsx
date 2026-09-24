import { useTranslation } from "react-i18next";
import { TRASH_RETENTION_OPTIONS } from "@/shared/lib/constants";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { Select } from "@/shared/ui/Select";
import {
  RETENTION_LABEL_KEYS,
  retentionKey,
} from "@/features/settings/lib/dataLabels";
import { SettingsGroup, SettingsRow } from "../SettingsSection";

export const TrashPanel = () => {
  const { t } = useTranslation();
  const notebooks = useNoteStore((state) => state.notebooks);
  const retentionDays = useSettingsStore((state) => state.trash.retentionDays);
  const setTrashSettings = useSettingsStore((state) => state.setTrashSettings);

  const trashedCount = notebooks.reduce(
    (total, notebook) =>
      total +
      (notebook.deletedAt !== null ? 1 : 0) +
      notebook.notes.filter((note) => note.deletedAt !== null).length,
    0,
  );

  const trashKeepDescription =
    trashedCount > 0
      ? t("settings.data.trashKeepDesc", { count: trashedCount })
      : t("settings.data.trashKeepDescNone");

  return (
    <SettingsGroup title={t("settings.data.trashGroup")}>
      <SettingsRow
        title={t("settings.data.trashKeepTitle")}
        description={trashKeepDescription}
      >
        <Select
          label={t("settings.data.trashRetentionLabel")}
          value={retentionKey(retentionDays)}
          options={TRASH_RETENTION_OPTIONS.map((option) => ({
            value: retentionKey(option),
            label: t(RETENTION_LABEL_KEYS[retentionKey(option)]),
          }))}
          onChange={(value) =>
            setTrashSettings({
              retentionDays: value === "forever" ? null : Number(value),
            })
          }
        />
      </SettingsRow>
    </SettingsGroup>
  );
};
