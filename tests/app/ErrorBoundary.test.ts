import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import i18n from "@/app/i18n";
import { ErrorBoundary } from "@/app/ErrorBoundary";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const Boom = () => {
  throw new Error("boom");
};

describe("ErrorBoundary", () => {
  it("shows a recovery screen instead of blanking the app", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    vi.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => {
      root.render(createElement(ErrorBoundary, null, createElement(Boom)));
    });

    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.textContent).toContain(i18n.t("errors.title"));
    expect(container.textContent).toContain(i18n.t("errors.reload"));
    expect(container.textContent).toContain(i18n.t("errors.exportBackup"));

    await act(async () => {
      root.unmount();
    });
  });
});
