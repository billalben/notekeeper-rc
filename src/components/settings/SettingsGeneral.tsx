import { ComingSoon, SettingsGroup, SettingsRow } from "./SettingsSection";

export const SettingsGeneral = () => (
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
