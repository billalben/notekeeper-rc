import { describe, expect, it, vi } from "vitest";
import {
  estimateBytes,
  formatBytes,
  isLocalStorageAvailable,
} from "@/shared/lib/storage";

describe("estimateBytes", () => {
  it("counts UTF-8 bytes", () => {
    expect(estimateBytes("abc")).toBe(3);
    expect(estimateBytes("é")).toBe(2);
    expect(estimateBytes("😀")).toBe(4);
  });
});

describe("formatBytes", () => {
  it("formats bytes, kilobytes, and megabytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1023)).toBe("1023 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.00 MB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.50 MB");
  });
});

describe("isLocalStorageAvailable", () => {
  it("is true when storage is writable", () => {
    expect(isLocalStorageAvailable()).toBe(true);
  });

  it("is false when storage access is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(isLocalStorageAvailable()).toBe(false);
  });

  it("is true when only the quota is exceeded", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    expect(isLocalStorageAvailable()).toBe(true);
  });
});
