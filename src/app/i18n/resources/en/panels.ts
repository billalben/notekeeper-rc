export const search = {
  label: "Search notes",
  placeholder: "Search notes…",
  results: "Search results",
  noMatches: "No notes match “{{query}}”",
  hint: "Search across every notebook by title or content",
  resultCount_one: "{{count}} result",
  resultCount_other: "{{count}} results",
} as const;

export const trash = {
  title: "Trash",
  retentionNever: "Items in the Trash are kept until you delete them.",
  retentionDays:
    "Items in the Trash are permanently deleted after {{days}} days.",
  emptyTrash: "Empty Trash",
  empty: "Trash is empty",
  everything: "everything in the Trash",
  deleted: "Deleted {{time}}",
  restore: "Restore",
  restoreTitle: "Restore {{title}}",
  deletePermanently: "Delete permanently",
  deleteTitle: "Delete {{title}} permanently",
} as const;

export const archive = {
  title: "Archive",
  description:
    "Archived notes stay out of your smart views until you unarchive them.",
  empty: "Archive is empty",
  archived: "Archived {{time}}",
  readOnlyHint: "Archived notes are read-only. Unarchive this note to edit it.",
  noContent: "This note has no content.",
  unarchive: "Unarchive note",
  download: "Download note",
  delete: "Delete note",
} as const;

export const selection = {
  label: "Note selection",
  start: "Select notes",
  selected_one: "{{count}} selected",
  selected_other: "{{count}} selected",
  selectAll: "Select all",
  clearAll: "Clear all",
  archive: "Archive",
  unarchive: "Unarchive",
} as const;

export const stats = {
  title: "Statistics",
  noNotesYet: "No notes yet",
  noNotesHint: "Write your first note to see your writing stats here.",
  newNote: "New note",
  thisWeek: "This week",
  noWrites: "No notes written or edited this week.",
  writes: "{{created}} written, {{edited}} edited.",
  chartLabel:
    "{{created}} notes created and {{edited}} edited over the last 7 days.",
  lastEdited: "Last edited",
  lastCreated: "Last created",
  totalWriting: "Total writing",
  words: "words",
  characters: "Characters",
  avgWordsPerNote: "Avg. words per note",
  whereNotesLive: "Where your notes live",
  notesAcross: "{{notes}} notes across {{notebooks}} notebooks",
  current: "Current",
  pinnedAndFavorites: "Pinned and Favorites",
  pinnedNotes: "Pinned notes",
  favorites: "Favorites",
  pickUp: "Pick up where you left off",
  storage: "Storage",
  percentUsed: "{{percent}}% used",
  browserLimit: "~{{size}} browser limit",
  storageUnavailable: "Storage information isn't available in this browser.",
  storageUsed: "Storage used",
  today: "Today",
  emptyOne: "1 notebook is empty: {{list}}.",
  emptyOther: "{{count}} notebooks are empty: {{list}}.",
  emptyMore: "{{list}} and {{count}} more",
} as const;
