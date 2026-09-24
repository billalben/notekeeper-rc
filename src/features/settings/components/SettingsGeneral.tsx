import { useTranslation } from "react-i18next";
import { LANGUAGES, type Language } from "@/app/i18n";
import {
  useSettingsStore,
  type EditorMode,
  type EditorPresentation,
} from "@/shared/stores/useSettingsStore";
import {
  SettingsGroup,
  SettingsRow,
} from "@/features/settings/components/SettingsSection";
import { Select } from "@/shared/ui/Select";
import { Switch } from "@/shared/ui/Switch";

export const SettingsGeneral = () => {
  const { t } = useTranslation();
  const autosave = useSettingsStore((state) => state.editor.autosave);
  const defaultMode = useSettingsStore((state) => state.editor.defaultMode);
  const presentation = useSettingsStore((state) => state.editor.presentation);
  const showWordCount = useSettingsStore((state) => state.editor.showWordCount);
  const closeModalOnBackdropClick = useSettingsStore(
    (state) => state.editor.closeModalOnBackdropClick,
  );
  const setEditorSettings = useSettingsStore(
    (state) => state.setEditorSettings,
  );
  const header = useSettingsStore((state) => state.header);
  const setHeaderSettings = useSettingsStore(
    (state) => state.setHeaderSettings,
  );
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  return (
    <>
      <SettingsGroup title={t("settings.general.languageGroup")}>
        <SettingsRow
          title={t("settings.general.languageTitle")}
          description={t("settings.general.languageDesc")}
        >
          <Select
            label={t("settings.general.languageLabel")}
            value={language}
            options={LANGUAGES.map((item) => ({
              value: item.code,
              label: item.nativeLabel,
            }))}
            onChange={(value) => setLanguage(value as Language)}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title={t("settings.general.editorGroup")}>
        <SettingsRow
          title={t("settings.general.autosaveTitle")}
          description={t("settings.general.autosaveDesc")}
        >
          <Switch
            checked={autosave}
            label={t("settings.general.autosaveLabel")}
            onChange={(checked) => setEditorSettings({ autosave: checked })}
          />
        </SettingsRow>
        <SettingsRow
          title={t("settings.general.openNotesInTitle")}
          description={t("settings.general.openNotesInDesc")}
        >
          <Select
            label={t("settings.general.editorSizeLabel")}
            value={presentation}
            options={[
              {
                value: "modal",
                label: t("settings.general.presentationModal"),
              },
              {
                value: "full",
                label: t("settings.general.presentationFull"),
              },
              {
                value: "split",
                label: t("settings.general.presentationSplit"),
              },
            ]}
            onChange={(value) =>
              setEditorSettings({
                presentation: value as EditorPresentation,
              })
            }
          />
        </SettingsRow>
        <SettingsRow
          title={t("settings.general.defaultViewTitle")}
          description={t("settings.general.defaultViewDesc")}
        >
          <Select
            label={t("settings.general.defaultViewLabel")}
            value={defaultMode}
            options={[
              { value: "preview", label: t("settings.general.preview") },
              { value: "edit", label: t("settings.general.edit") },
            ]}
            onChange={(value) =>
              setEditorSettings({ defaultMode: value as EditorMode })
            }
          />
        </SettingsRow>
        <SettingsRow
          title={t("settings.general.wordCountTitle")}
          description={t("settings.general.wordCountDesc")}
        >
          <Switch
            checked={showWordCount}
            label={t("settings.general.wordCountLabel")}
            onChange={(checked) =>
              setEditorSettings({ showWordCount: checked })
            }
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title={t("settings.general.modalsGroup")}>
        <SettingsRow
          title={t("settings.general.closeOutsideTitle")}
          description={t("settings.general.closeOutsideDesc")}
        >
          <Switch
            checked={closeModalOnBackdropClick}
            label={t("settings.general.closeOutsideLabel")}
            onChange={(checked) =>
              setEditorSettings({ closeModalOnBackdropClick: checked })
            }
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title={t("settings.general.headerGroup")}>
        <SettingsRow
          title={t("settings.general.searchTitle")}
          description={t("settings.general.searchDesc")}
        >
          <Switch
            checked={header.showSearch}
            label={t("settings.general.searchLabel")}
            onChange={(checked) => setHeaderSettings({ showSearch: checked })}
          />
        </SettingsRow>
        <SettingsRow
          title={t("settings.general.shortcutsTitle")}
          description={t("settings.general.shortcutsDesc")}
        >
          <Switch
            checked={header.showShortcuts}
            label={t("settings.general.shortcutsLabel")}
            onChange={(checked) =>
              setHeaderSettings({ showShortcuts: checked })
            }
          />
        </SettingsRow>
        <SettingsRow
          title={t("settings.general.themeToggleTitle")}
          description={t("settings.general.themeToggleDesc")}
        >
          <Switch
            checked={header.showTheme}
            label={t("settings.general.themeToggleLabel")}
            onChange={(checked) => setHeaderSettings({ showTheme: checked })}
          />
        </SettingsRow>
      </SettingsGroup>
    </>
  );
};
