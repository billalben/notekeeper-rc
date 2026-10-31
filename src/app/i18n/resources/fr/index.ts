import { common, header, sidebar, confirm, toasts, pwa, errors } from "./core";
import { notes, card, editor, tags, move, history } from "./notes";
import { archive, search, selection, trash, stats } from "./panels";
import { settings } from "./settings";
import { tour } from "./tour";

const fr = {
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
  errors,
  settings,
  tour,
} as const;

export default fr;
