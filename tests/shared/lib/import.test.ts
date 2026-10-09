import { describe, expect, it } from "vitest";
import { BackupParseError, parseBackupFile } from "@/shared/lib/import";

const backupFile = (overrides: Record<string, unknown> = {}) => ({
  app: "notekeeper",
  schemaVersion: 1,
  exportedAt: "2024-01-01T00:00:00.000Z",
  notebooks: [],
  tags: [],
  ...overrides,
});

describe("parseBackupFile", () => {
  it("imports notebooks and notes, regenerating every id", () => {
    const { notebooks, tags } = parseBackupFile(
      JSON.stringify(
        backupFile({
          notebooks: [
            {
              id: "nb1",
              name: "Work",
              pinned: true,
              notes: [
                {
                  id: "n1",
                  title: "Hello",
                  text: "body",
                  tags: ["work"],
                  postedOn: 1000,
                  updatedOn: 2000,
                  pinned: true,
                  favorite: false,
                },
              ],
            },
          ],
          tags: ["work"],
        }),
      ),
    );

    expect(notebooks).toHaveLength(1);
    const [notebook] = notebooks;
    expect(notebook.name).toBe("Work");
    expect(notebook.pinned).toBe(true);
    expect(notebook.id).not.toBe("nb1");

    expect(notebook.notes).toHaveLength(1);
    const [note] = notebook.notes;
    expect(note.id).not.toBe("n1");
    expect(note.notebookId).toBe(notebook.id);
    expect(note).toMatchObject({
      title: "Hello",
      text: "body",
      tags: ["work"],
      postedOn: 1000,
      updatedOn: 2000,
      pinned: true,
      favorite: false,
      deletedAt: null,
    });
    expect(tags).toEqual(["work"]);
  });

  it("rejects malformed JSON", () => {
    expect(() => parseBackupFile("{ not json")).toThrow(BackupParseError);
  });

  it("rejects files that are not Notekeeper backups", () => {
    expect(() => parseBackupFile(JSON.stringify(["a"]))).toThrow(
      BackupParseError,
    );
    expect(() => parseBackupFile(JSON.stringify({ hello: "world" }))).toThrow(
      BackupParseError,
    );
    expect(() =>
      parseBackupFile(JSON.stringify(backupFile({ app: "other" }))),
    ).toThrow(BackupParseError);
    expect(() =>
      parseBackupFile(JSON.stringify(backupFile({ notebooks: undefined }))),
    ).toThrow(BackupParseError);
  });

  it("backfills defaults, normalizes tags, and names blanks Untitled", () => {
    const { notebooks, tags } = parseBackupFile(
      JSON.stringify(
        backupFile({
          notebooks: [
            {
              id: "nb",
              name: "   ",
              notes: [
                {
                  id: "n",
                  title: "T",
                  text: undefined,
                  tags: ["#Work", "work", "home", 42],
                },
              ],
            },
          ],
          tags: ["Work", "Zeta"],
        }),
      ),
    );

    const [notebook] = notebooks;
    expect(notebook.name).toBe("Untitled");
    expect(notebook.pinned).toBe(false);

    const [note] = notebook.notes;
    expect(note.text).toBe("");
    expect(note.tags).toEqual(["Work", "home"]);
    expect(note.favorite).toBe(false);
    expect(note.updatedOn).toBe(note.postedOn);
    expect(tags).toEqual(["home", "Work", "Zeta"]);
  });

  it("accepts an empty but valid backup", () => {
    expect(parseBackupFile(JSON.stringify(backupFile()))).toEqual({
      notebooks: [],
      tags: [],
    });
  });
});
