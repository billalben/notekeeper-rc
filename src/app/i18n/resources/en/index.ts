import { common, header, sidebar, confirm, toasts, pwa } from "./core";
import { notes, card, editor, tags, move, history } from "./notes";
import { archive, search, selection, trash, stats } from "./panels";
import { settings } from "./settings";
import { tour } from "./tour";

const en = {
  common,
  header,
  sidebar,
  notes,
  card,
  editor,
  tags,
  search,
  trash,
  archive,
  selection,
  confirm,
  move,
  history,
  stats,
  toasts,
  pwa,
  settings,
  tour,
} as const;

export default en;
