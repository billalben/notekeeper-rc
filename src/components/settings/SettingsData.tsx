import { ComingSoon, SettingsGroup, SettingsRow } from "./SettingsSection";

export const SettingsData = () => (
  <>
    <SettingsGroup title="Backup">
      <SettingsRow
        title="Export notes"
        description="Download all data, a notebook, or the current note."
      >
        <ComingSoon />
      </SettingsRow>
      <SettingsRow
        title="Import notes"
        description="Restore notes from a previously exported file."
      >
        <ComingSoon />
      </SettingsRow>
    </SettingsGroup>

    <SettingsGroup title="Storage">
      <SettingsRow
        title="Storage usage"
        description="See how much of your browser storage is used."
      >
        <ComingSoon />
      </SettingsRow>
    </SettingsGroup>

    <SettingsGroup title="Danger zone">
      <SettingsRow
        title="Delete all data"
        description="Permanently remove all notes and notebooks. This cannot be undone."
      >
        <ComingSoon />
      </SettingsRow>
    </SettingsGroup>
  </>
);
