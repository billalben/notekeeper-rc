import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { scheduleTrashPurge } from "@/shared/lib/trashPurge";

const setVisibility = (state: "visible" | "hidden") => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
};

describe("scheduleTrashPurge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility("visible");
  });

  afterEach(() => {
    setVisibility("visible");
  });

  it("purges immediately and on every interval", () => {
    const purge = vi.fn();
    const stop = scheduleTrashPurge(purge, 1000);

    expect(purge).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(3000);

    expect(purge).toHaveBeenCalledTimes(4);
    stop();
  });

  it("purges when the tab becomes visible or gains focus", () => {
    const purge = vi.fn();
    const stop = scheduleTrashPurge(purge, 1000);
    purge.mockClear();

    setVisibility("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(purge).not.toHaveBeenCalled();

    setVisibility("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(purge).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event("focus"));
    expect(purge).toHaveBeenCalledTimes(2);

    stop();
  });

  it("stops purging after cleanup", () => {
    const purge = vi.fn();
    const stop = scheduleTrashPurge(purge, 1000);
    purge.mockClear();

    stop();
    vi.advanceTimersByTime(5000);
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("focus"));

    expect(purge).not.toHaveBeenCalled();
  });
});
