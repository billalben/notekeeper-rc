export const search = {
  label: "Rechercher des notes",
  placeholder: "Rechercher des notes…",
  results: "Résultats de recherche",
  noMatches: "Aucune note ne correspond à « {{query}} »",
  hint: "Recherchez dans tous les carnets par titre ou contenu",
  resultCount_one: "{{count}} résultat",
  resultCount_other: "{{count}} résultats",
} as const;

export const trash = {
  title: "Corbeille",
  retentionNever:
    "Les éléments de la corbeille sont conservés jusqu'à leur suppression.",
  retentionDays:
    "Les éléments de la corbeille sont définitivement supprimés après {{days}} jours.",
  emptyTrash: "Vider la corbeille",
  empty: "La corbeille est vide",
  everything: "tout le contenu de la corbeille",
  deleted: "Supprimé {{time}}",
  restore: "Restaurer",
  restoreTitle: "Restaurer {{title}}",
  deletePermanently: "Supprimer définitivement",
  deleteTitle: "Supprimer {{title}} définitivement",
} as const;

export const archive = {
  title: "Archives",
  description:
    "Les notes archivées restent hors de vos vues intelligentes jusqu'à leur désarchivage.",
  empty: "Les archives sont vides",
  archived: "Archivée {{time}}",
  readOnlyHint:
    "Les notes archivées sont en lecture seule. Désarchivez cette note pour la modifier.",
  noContent: "Cette note n'a pas de contenu.",
  unarchive: "Désarchiver la note",
  download: "Télécharger la note",
  delete: "Supprimer la note",
} as const;

export const selection = {
  label: "Sélection de notes",
  start: "Sélectionner des notes",
  selected_one: "{{count}} sélectionnée",
  selected_other: "{{count}} sélectionnées",
  selectAll: "Tout sélectionner",
  clearAll: "Tout désélectionner",
  archive: "Archiver",
  unarchive: "Désarchiver",
} as const;

export const stats = {
  title: "Statistiques",
  noNotesYet: "Aucune note pour l'instant",
  noNotesHint: "Écrivez votre première note pour voir vos statistiques ici.",
  newNote: "Nouvelle note",
  thisWeek: "Cette semaine",
  noWrites: "Aucune note écrite ou modifiée cette semaine.",
  writes: "{{created}} écrites, {{edited}} modifiées.",
  chartLabel:
    "{{created}} notes créées et {{edited}} modifiées au cours des 7 derniers jours.",
  lastEdited: "Dernière modification",
  lastCreated: "Dernière création",
  totalWriting: "Écriture totale",
  words: "mots",
  characters: "Caractères",
  avgWordsPerNote: "Mots moyens par note",
  whereNotesLive: "Où vivent vos notes",
  notesAcross: "{{notes}} notes dans {{notebooks}} carnets",
  current: "Actuel",
  pinnedAndFavorites: "Épinglées et favorites",
  pinnedNotes: "Notes épinglées",
  favorites: "Favorites",
  pickUp: "Reprenez où vous en étiez",
  storage: "Stockage",
  percentUsed: "{{percent}} % utilisés",
  browserLimit: "~{{size}} limite du navigateur",
  storageUnavailable:
    "Les informations de stockage ne sont pas disponibles dans ce navigateur.",
  storageUsed: "Stockage utilisé",
  today: "Aujourd'hui",
  emptyOne: "1 carnet est vide : {{list}}.",
  emptyOther: "{{count}} carnets sont vides : {{list}}.",
  emptyMore: "{{list}} et {{count}} de plus",
} as const;
