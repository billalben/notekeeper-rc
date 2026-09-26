import { describe, expect, it } from "vitest";
import { clamp } from "@/shared/lib/math";

describe("clamp", () => {
  it("returns the value when inside the range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("raises values below the minimum to the minimum", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it("lowers values above the maximum to the maximum", () => {
    expect(clamp(42, 0, 10)).toBe(10);
  });

  it("supports inverted-feeling bounds when min is negative", () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
  });
});
