import { describe, expect, it } from "vitest";
import {
  buildNoteSeed,
  parseLaunchIntent,
  SHORTCUT_URLS,
} from "@/shared/lib/pwa";

describe("parseLaunchIntent", () => {
  it("parses a share payload delivered to the share path", () => {
    expect(
      parseLaunchIntent(
        "/share",
        "?title=Hello&text=World&url=https%3A%2F%2Fexample.com",
      ),
    ).toEqual({
      kind: "share",
      content: {
        title: "Hello",
        text: "World",
        url: "https://example.com",
      },
      seed: {
        title: "Hello",
        text: "World\n\nhttps://example.com",
      },
    });
  });

  it("still supports the ?share marker for manual launches", () => {
    expect(parseLaunchIntent("/", "?share&text=Hello")).toMatchObject({
      kind: "share",
      content: { text: "Hello" },
    });
  });

  it("accepts a shared URL on its own", () => {
    const intent = parseLaunchIntent(
      "/share",
      "?url=https%3A%2F%2Fexample.com%2Fpost",
    );
    expect(intent).toMatchObject({
      kind: "share",
      seed: { title: "", text: "https://example.com/post" },
    });
  });

  it("ignores an empty share payload", () => {
    expect(parseLaunchIntent("/share", "")).toBeNull();
    expect(parseLaunchIntent("/share", "?title=%20%20")).toBeNull();
    expect(parseLaunchIntent("/", "?share")).toBeNull();
  });

  it("does not treat arbitrary query params as a share", () => {
    expect(parseLaunchIntent("/", "?title=Hello&text=World")).toBeNull();
  });

  it("parses manifest shortcut actions", () => {
    expect(parseLaunchIntent("/", "?action=new-note")).toEqual({
      kind: "shortcut",
      action: "new-note",
    });
    expect(parseLaunchIntent("/", "?action=search")).toEqual({
      kind: "shortcut",
      action: "search",
    });
  });

  it("ignores unknown actions and paths", () => {
    expect(parseLaunchIntent("/", "?action=delete-everything")).toBeNull();
    expect(parseLaunchIntent("/share", "?action=search")).toBeNull();
    expect(parseLaunchIntent("/", "")).toBeNull();
  });
});

describe("buildNoteSeed", () => {
  it("trims fields and separates the URL with a blank line", () => {
    expect(
      buildNoteSeed({
        title: "  Title  ",
        text: "  Body  ",
        url: "  https://example.com  ",
      }),
    ).toEqual({ title: "Title", text: "Body\n\nhttps://example.com" });
  });

  it("does not duplicate a URL already present in the text", () => {
    expect(
      buildNoteSeed({
        title: "",
        text: "See https://example.com",
        url: "https://example.com",
      }).text,
    ).toBe("See https://example.com");
  });

  it("handles missing pieces", () => {
    expect(buildNoteSeed({ title: "", text: "", url: "" })).toEqual({
      title: "",
      text: "",
    });
  });
});

describe("manifest shortcut URLs", () => {
  it("match the launch parser", () => {
    expect(parseLaunchIntent("/", SHORTCUT_URLS.newNote.slice(1))).toEqual({
      kind: "shortcut",
      action: "new-note",
    });
    expect(parseLaunchIntent("/", SHORTCUT_URLS.search.slice(1))).toEqual({
      kind: "shortcut",
      action: "search",
    });
  });
});
