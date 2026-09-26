import { describe, expect, it, vi } from "vitest";
import { makeNote, makeNotebook } from "@tests/factories";
import {
  MIME_MARKDOWN,
  downloadBackupFile,
  downloadNoteFile,
  downloadNotebookFile,
  slugify,
} from "@/shared/lib/export";

const captureDownload = (run: () => void) => {
  const blobs: Blob[] = [];
  let filename = "";
  vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
    blobs.push(blob as Blob);
    return "blob:test";
  });
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    filename = this.download;
  });

  run();
  return { blobs, filename };
};

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });

  it("trims and drops separators from the edges", () => {
    expect(slugify("  --Road  Map--  ")).toBe("road-map");
    expect(slugify("!!!")).toBe("");
  });

  it("caps the length at 60 characters", () => {
    expect(slugify("a".repeat(80))).toHaveLength(60);
  });
});

describe("downloadBackupFile", () => {
  it("exports visible notebooks only and a stable schema", async () => {
    const notebooks = [
      makeNotebook({
        id: "nb1",
        name: "Work",
        notes: [
          makeNote({ id: "n1", title: "Keep", tags: ["work"] }),
          makeNote({ id: "n2", deletedAt: 1 }),
        ],
      }),
      makeNotebook({
        id: "nb2",
        deletedAt: 1,
        notes: [makeNote({ id: "n3" })],
      }),
    ];

    const { blobs, filename } = captureDownload(() =>
      downloadBackupFile(notebooks, ["work", "home"]),
    );

    expect(filename).toMatch(/^notekeeper-backup-\d{4}-\d{2}-\d{2}\.json$/);

    const payload = JSON.parse(await blobs[0].text());
    expect(payload).toMatchObject({ app: "notekeeper", schemaVersion: 1 });
    expect(typeof payload.exportedAt).toBe("string");
    expect(payload.tags).toEqual(["work", "home"]);
    expect(payload.notebooks).toHaveLength(1);
    expect(payload.notebooks[0]).toMatchObject({ id: "nb1", name: "Work" });
    expect(
      payload.notebooks[0].notes.map((note: { id: string }) => note.id),
    ).toEqual(["n1"]);
    expect(payload.notebooks[0].notes[0].tags).toEqual(["work"]);
  });
});

describe("downloadNotebookFile", () => {
  const notebook = makeNotebook({
    id: "nb1",
    name: "My Notebook",
    notes: [makeNote({ title: "First", text: "body text" })],
  });

  it("writes a JSON file named after the notebook", async () => {
    const { blobs, filename } = captureDownload(() =>
      downloadNotebookFile(notebook, "json"),
    );
    expect(filename).toMatch(
      /^notekeeper-my-notebook-\d{4}-\d{2}-\d{2}\.json$/,
    );
    const payload = JSON.parse(await blobs[0].text());
    expect(payload.notebooks[0].name).toBe("My Notebook");
  });

  it("writes a Markdown file with frontmatter and note body", async () => {
    const { blobs, filename } = captureDownload(() =>
      downloadNotebookFile(notebook, "md"),
    );
    expect(filename).toMatch(/^notekeeper-my-notebook-\d{4}-\d{2}-\d{2}\.md$/);

    const markdown = await blobs[0].text();
    expect(markdown).toContain('notebook: "My Notebook"');
    expect(markdown).toContain("body text");
  });
});

describe("downloadNoteFile", () => {
  it("escapes quotes and newlines in Markdown frontmatter", async () => {
    const { blobs, filename } = captureDownload(() =>
      downloadNoteFile(
        {
          title: 'He said "hi"\nagain',
          text: "body",
          tags: ["a", "b"],
          postedOn: 0,
          updatedOn: 0,
        },
        "Work",
        "md",
      ),
    );

    expect(filename).toMatch(
      /^notekeeper-he-said-hi-again-\d{4}-\d{2}-\d{2}\.md$/,
    );
    const markdown = await blobs[0].text();
    expect(markdown).toContain('title: "He said \\"hi\\"\\nagain"');
    expect(markdown).toContain('tags: ["a", "b"]');
    expect(MIME_MARKDOWN).toBe("text/markdown");
  });

  it("includes the notebook name in a JSON export", async () => {
    const { blobs } = captureDownload(() =>
      downloadNoteFile(
        { title: "Solo", text: "body", tags: [] },
        "Work",
        "json",
      ),
    );
    const payload = JSON.parse(await blobs[0].text());
    expect(payload.notebookName).toBe("Work");
    expect(payload.note.title).toBe("Solo");
  });
});
