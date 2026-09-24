export interface EditResult {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

/**
 * Wrap the current selection (or `placeholder` when nothing is selected) with
 * `before`/`after` markers and keep the inner text selected.
 */
export const wrapSelection = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after: string,
  placeholder: string,
): EditResult => {
  const selected = value.slice(selectionStart, selectionEnd) || placeholder;
  const next =
    value.slice(0, selectionStart) +
    before +
    selected +
    after +
    value.slice(selectionEnd);
  const start = selectionStart + before.length;

  return {
    value: next,
    selectionStart: start,
    selectionEnd: start + selected.length,
  };
};

/**
 * Toggle `prefix` on every line touched by the selection: lines that already
 * start with it have it removed, the rest get it prepended. The caret ends up
 * after the rewritten block.
 */
export const toggleLinePrefix = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
): EditResult => {
  const start = value.lastIndexOf("\n", selectionStart - 1) + 1;
  let end = value.indexOf("\n", selectionEnd);
  if (end < 0) end = value.length;

  const block = value
    .slice(start, end)
    .split("\n")
    .map((line) =>
      line.startsWith(prefix) ? line.slice(prefix.length) : prefix + line,
    )
    .join("\n");

  return {
    value: value.slice(0, start) + block + value.slice(end),
    selectionStart: start,
    selectionEnd: start + block.length,
  };
};
