import { common, header, sidebar, confirm, toasts, pwa } from "./core";
import { notes, card, editor, tags, move } from "./notes";
import { search, trash, stats } from "./panels";
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
  confirm,
  move,
  stats,
  toasts,
  pwa,
  settings,
  tour,
} as const;

export default fr;
