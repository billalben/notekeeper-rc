import { describe, expect, it } from "vitest";
import { countWords, stripMarkdown } from "@/shared/lib/text";

describe("countWords", () => {
  it("returns 0 for empty or whitespace-only text", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n\t ")).toBe(0);
  });

  it("counts words separated by any whitespace", () => {
    expect(countWords("hello world")).toBe(2);
    expect(countWords("  one\ttwo\nthree  ")).toBe(3);
  });
});

describe("stripMarkdown", () => {
  it("removes fenced code blocks", () => {
    const result = stripMarkdown("before ```js\nconst x = 1;\n``` after");
    expect(result).not.toContain("```");
    expect(result).not.toContain("const x");
    expect(result).toContain("before");
    expect(result).toContain("after");
  });

  it("keeps inline code content but drops the backticks", () => {
    expect(stripMarkdown("use `const x` here")).toBe("use const x here");
  });

  it("keeps link text and strips the target", () => {
    expect(stripMarkdown("see [the docs](https://example.com)")).toBe(
      "see the docs",
    );
    expect(stripMarkdown("![alt](image.png)")).toBe("alt");
  });

  it("strips heading, list, and quote markers", () => {
    expect(stripMarkdown("# Title\n> quote\n- item\n1. one")).toBe(
      "Title\nquote\nitem\none",
    );
  });

  it("removes emphasis markers", () => {
    expect(stripMarkdown("**bold** and _italic_ and ~~strike~~")).toBe(
      "bold and italic and strike",
    );
  });
});
