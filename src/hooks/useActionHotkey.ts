import { useCallback, useEffect, useRef } from "react";
import { useHotkeys, type HotkeyCallback } from "react-hotkeys-hook";
import { useSettingsStore } from "../store/useSettingsStore";
import { useUIStore } from "../store/useUIStore";
import { normalizeChord, type ActionId } from "../utils/shortcuts";

export interface ActionHotkeyOptions {
  enabled?: boolean;
  enableOnFormTags?: boolean;
}

/**
 * Bind an action's (rebindable) shortcut to a handler. The chord is read from
 * the settings store, so rebinding in Settings takes effect immediately, and
 * every binding is suspended while the shortcut recorder is capturing keys.
 */
export const useActionHotkey = (
  actionId: ActionId,
  handler: HotkeyCallback,
  options: ActionHotkeyOptions = {},
): void => {
  const chord = useSettingsStore((state) => state.shortcuts[actionId]);
  const isRecording = useUIStore((state) => state.isRecordingShortcut);

  const enabled = (options.enabled ?? true) && !isRecording;
  const enableOnFormTags = options.enableOnFormTags ?? false;

  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  const callback = useCallback<HotkeyCallback>((event, hotkeysEvent) => {
    handlerRef.current(event, hotkeysEvent);
  }, []);

  const hotkey = normalizeChord(chord);

  useHotkeys(
    hotkey,
    callback,
    {
      enabled: enabled && hotkey.length > 0,
      enableOnFormTags,
      preventDefault: true,
    },
    [hotkey, enabled, enableOnFormTags],
  );
};
