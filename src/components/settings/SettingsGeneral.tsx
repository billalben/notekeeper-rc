import { useSettingsStore } from "../../store/useSettingsStore";
import {
  ComingSoon,
  SettingsGroup,
  SettingsRow,
  SettingsSwitch,
} from "./SettingsSection";

export const SettingsGeneral = () => {
  const showWordCount = useSettingsStore((state) => state.editor.showWordCount);
  const setEditorSettings = useSettingsStore(
    (state) => state.setEditorSettings,
  );

  return (
    <>
      <SettingsGroup title="Editor">
        <SettingsRow
          title="Autosave"
          description="Edits save automatically as you type."
        >
          <ComingSoon />
        </SettingsRow>
        <SettingsRow
          title="Open notes in"
          description="Choose between a modal or a full page."
        >
          <ComingSoon />
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
