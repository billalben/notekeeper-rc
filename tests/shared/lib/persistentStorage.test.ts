import { describe, expect, it, vi } from "vitest";
import {
  getPersistentStorageStatus,
  requestPersistentStorage,
} from "@/shared/lib/persistentStorage";

const stubStorage = (storage: {
  persisted?: () => Promise<boolean>;
  persist?: () => Promise<boolean>;
}) => vi.stubGlobal("navigator", { storage });

describe("getPersistentStorageStatus", () => {
  it("reports unsupported when the Storage Manager is missing", async () => {
    vi.stubGlobal("navigator", {});
    await expect(getPersistentStorageStatus()).resolves.toEqual({
      supported: false,
      persisted: false,
    });
  });

  it("reports persisted when the browser says so", async () => {
    stubStorage({ persisted: vi.fn().mockResolvedValue(true) });
    await expect(getPersistentStorageStatus()).resolves.toEqual({
      supported: true,
      persisted: true,
    });
  });

  it("degrades safely when the check throws", async () => {
    stubStorage({ persisted: vi.fn().mockRejectedValue(new Error("denied")) });
    await expect(getPersistentStorageStatus()).resolves.toEqual({
      supported: false,
      persisted: false,
    });
  });
});

describe("requestPersistentStorage", () => {
  it("returns false when unsupported", async () => {
    vi.stubGlobal("navigator", {});
    await expect(requestPersistentStorage()).resolves.toBe(false);
  });

  it("returns early when storage is already persistent", async () => {
    const persist = vi.fn();
    stubStorage({
      persisted: vi.fn().mockResolvedValue(true),
      persist,
    });

    await expect(requestPersistentStorage()).resolves.toBe(true);
    expect(persist).not.toHaveBeenCalled();
  });

  it("returns the browser's answer", async () => {
    const persist = vi.fn().mockResolvedValue(true);
    stubStorage({
      persisted: vi.fn().mockResolvedValue(false),
      persist,
    });

    await expect(requestPersistentStorage()).resolves.toBe(true);
    expect(persist).toHaveBeenCalledOnce();
  });

  it("returns false when the request is denied or throws", async () => {
    stubStorage({
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockResolvedValue(false),
    });
    await expect(requestPersistentStorage()).resolves.toBe(false);

    stubStorage({
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockRejectedValue(new Error("blocked")),
    });
    await expect(requestPersistentStorage()).resolves.toBe(false);
  });
});
