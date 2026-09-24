import { toText } from "hast-util-to-text";
import type { Element, Root } from "hast";
import { createLowlight } from "lowlight";
import { visit } from "unist-util-visit";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

/**
 * A trimmed down replacement for `rehype-highlight`. The original always pulls
 * in lowlight's `common` bundle (37 grammars, ~164 KB), which cannot be
 * tree-shaken because it is referenced as a fallback. This only registers the
 * grammars we actually want to ship.
 */
const lowlight = createLowlight({
  bash,
  c,
  cpp,
  css,
  go,
  java,
  javascript,
  json,
  markdown,
  python,
  rust,
  sql,
  typescript,
  xml,
  yaml,
});

const CLASS_PREFIX = "hljs-";

/** Mirrors `language()` from `rehype-highlight`. */
const languageOf = (node: Element): string | false | undefined => {
  const list = node.properties.className;
  if (!Array.isArray(list)) return undefined;

  let name: string | undefined;

  for (const item of list) {
    const value = String(item);

    if (value === "no-highlight" || value === "nohighlight") return false;
    if (!name && value.startsWith("lang-")) name = value.slice(5);
    if (!name && value.startsWith("language-")) name = value.slice(9);
  }

  return name;
};

export const rehypeHighlightSubset =
  () =>
  (tree: Root): undefined => {
    visit(tree, "element", (node, _index, parent) => {
      if (
        node.tagName !== "code" ||
        !parent ||
        parent.type !== "element" ||
        parent.tagName !== "pre"
      ) {
        return;
      }

      const lang = languageOf(node);
      if (lang === false || !lang) return;

      if (!Array.isArray(node.properties.className)) {
        node.properties.className = [];
      }
      if (!node.properties.className.includes("hljs")) {
        node.properties.className.unshift("hljs");
      }

      const text = toText(node, { whitespace: "pre" });

      try {
        const result = lowlight.highlight(lang, text, { prefix: CLASS_PREFIX });
        if (result.children.length > 0) {
          node.children = result.children as Element["children"];
        }
      } catch {
        // Unknown/unregistered language: leave the block unhighlighted.
      }
    });
  };
