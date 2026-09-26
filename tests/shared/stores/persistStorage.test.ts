import { describe, expect, it, vi } from "vitest";
import {
  createLocalStorage,
  isQuotaExceededError,
} from "@/shared/stores/persistStorage";

describe("isQuotaExceededError", () => {
  it("recognizes quota errors and rejects everything else", () => {
    expect(
      isQuotaExceededError(new DOMException("full", "QuotaExceededError")),
    ).toBe(true);
    expect(isQuotaExceededError(new Error("nope"))).toBe(false);
    expect(isQuotaExceededError(null)).toBe(false);
  });
});

describe("createLocalStorage", () => {
  it("reads, writes, and removes through localStorage", () => {
    const storage = createLocalStorage();
    storage.setItem("k", "v");
    expect(storage.getItem("k")).toBe("v");
    storage.removeItem("k");
    expect(storage.getItem("k")).toBeNull();
  });

  it("reports write failures instead of throwing", () => {
    const onError = vi.fn();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    const storage = createLocalStorage(onError);
    expect(() => storage.setItem("k", "v")).not.toThrow();
    expect(onError).toHaveBeenCalledOnce();
  });

  it("swallows read failures and returns null", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(createLocalStorage().getItem("k")).toBeNull();
  });

  it("swallows remove failures", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => createLocalStorage().removeItem("k")).not.toThrow();
  });
});
