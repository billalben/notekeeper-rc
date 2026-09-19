import {
  useSettingsStore,
  type EditorMode,
  type EditorPresentation,
} from "../../store/useSettingsStore";
import {
  ComingSoon,
  SettingsGroup,
  SettingsRow,
  SettingsSelect,
  SettingsSwitch,
} from "./SettingsSection";

export const SettingsGeneral = () => {
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
  const showSidebarCounts = useSettingsStore(
    (state) => state.sidebar.showCounts,
  );
  const setSidebarSettings = useSettingsStore(
    (state) => state.setSidebarSettings,
  );

  return (
    <>
      <SettingsGroup title="Editor">
        <SettingsRow
          title="Autosave"
          description="Edits save automatically as you type."
        >
          <SettingsSwitch
            checked={autosave}
            label="Autosave"
            onChange={(checked) => setEditorSettings({ autosave: checked })}
          />
        </SettingsRow>
        <SettingsRow
          title="Open notes in"
          description="Choose the editor size: a centered window or near-fullscreen."
        >
          <SettingsSelect
            label="Editor size"
            value={presentation}
            options={[
              { value: "modal", label: "Modal" },
              { value: "full", label: "Full page" },
            ]}
            onChange={(value) =>
              setEditorSettings({
                presentation: value as EditorPresentation,
              })
            }
          />
        </SettingsRow>
        <SettingsRow
          title="Default view"
          description="Choose how notes open in the editor."
        >
          <SettingsSelect
            label="Default editor view"
            value={defaultMode}
            options={[
              { value: "preview", label: "Preview" },
              { value: "edit", label: "Edit" },
            ]}
            onChange={(value) =>
              setEditorSettings({ defaultMode: value as EditorMode })
            }
          />
        </SettingsRow>
        <SettingsRow
          title="Word count"
          description="Show live word and character counts in the editor."
        >
          <SettingsSwitch
            checked={showWordCount}
            label="Word count"
            onChange={(checked) => setEditorSettings({ showWordCount: checked })}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Modals">
        <SettingsRow
          title="Close on outside click"
          description="Clicking the backdrop dismisses a modal. Off by default."
        >
          <SettingsSwitch
            checked={closeModalOnBackdropClick}
            label="Close modals when clicking outside"
            onChange={(checked) =>
              setEditorSettings({ closeModalOnBackdropClick: checked })
            }
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Sidebar">
        <SettingsRow
          title="Show counts"
          description="Show how many notes are in each notebook, Favorites, and Trash."
        >
          <SettingsSwitch
            checked={showSidebarCounts}
            label="Show sidebar counts"
            onChange={(checked) =>
              setSidebarSettings({ showCounts: checked })
            }
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Shortcuts">
        <SettingsRow
          title="Keyboard shortcuts"
          description="View and rebind keyboard shortcuts."
        >
          <ComingSoon />
        </SettingsRow>
      </SettingsGroup>
    </>
  );
};
