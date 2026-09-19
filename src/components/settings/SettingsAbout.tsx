import { SettingsGroup, SettingsRow } from "./SettingsSection";

export const SettingsAbout = () => (
  <>
    <SettingsGroup title="About Notekeeper">
      <SettingsRow
        title="Notekeeper"
        description="A simple, intuitive note-taking app that keeps your notes organized in notebooks — stored locally in your browser."
      />
      <SettingsRow
        title="Storage"
        description="Your notes never leave this device unless you export them."
      />
    </SettingsGroup>

    <SettingsGroup title="Credits">
      <SettingsRow title="Made by" description="Billal Benz" />
      <SettingsRow
        title="Copyright"
        description={`© ${new Date().getFullYear()} Billal Benz`}
      />
    </SettingsGroup>
  </>
);
