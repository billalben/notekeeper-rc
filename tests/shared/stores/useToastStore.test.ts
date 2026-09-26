import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_TOAST_SETTINGS } from "@/shared/stores/settings/defaults";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { toast, useToastStore } from "@/shared/stores/useToastStore";

const get = () => useToastStore.getState();
const toastState = useToastStore.getState();
const settingsState = useSettingsStore.getState();

beforeEach(() => {
  useToastStore.setState(toastState, true);
  useSettingsStore.setState(settingsState, true);
});

describe("addToast", () => {
  it("adds a toast and returns its id", () => {
    const id = get().addToast({ type: "info", message: "hello" });
    expect(id).toBeTypeOf("string");
    expect(get().toasts).toHaveLength(1);
    expect(get().toasts[0].message).toBe("hello");
  });

  it("does nothing while toasts are disabled", () => {
    useSettingsStore.setState({
      toasts: { ...DEFAULT_TOAST_SETTINGS, enabled: false },
    });
    expect(get().addToast({ type: "info", message: "hello" })).toBeUndefined();
    expect(get().toasts).toEqual([]);
  });

  it("clamps an explicit duration", () => {
    get().addToast({ type: "info", message: "hello", duration: 10 });
    expect(get().toasts[0].duration).toBe(1000);
  });

  it("keeps at most maxVisible toasts, dropping the oldest", () => {
    useSettingsStore.setState({
      toasts: { ...DEFAULT_TOAST_SETTINGS, maxVisible: 2 },
    });
    get().addToast({ type: "info", message: "one" });
    get().addToast({ type: "info", message: "two" });
    get().addToast({ type: "info", message: "three" });

    expect(get().toasts.map((item) => item.message)).toEqual(["two", "three"]);
  });
});

describe("dismiss / clear", () => {
  it("dismisses a toast by id", () => {
    const id = get().addToast({ type: "info", message: "hello" })!;
    get().dismissToast(id);
    expect(get().toasts).toEqual([]);
  });

  it("clears every toast", () => {
    get().addToast({ type: "info", message: "one" });
    get().addToast({ type: "info", message: "two" });
    get().clearToasts();
    expect(get().toasts).toEqual([]);
  });
});

describe("toast helper", () => {
  it("creates typed toasts", () => {
    toast.success("saved");
    toast.error("failed");
    toast.info("fyi");
    expect(get().toasts.map((item) => item.type)).toEqual([
      "success",
      "error",
      "info",
    ]);
  });
});
