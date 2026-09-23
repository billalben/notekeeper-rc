/** Strip common markdown syntax so text can be shown as a plain excerpt. */
export const stripMarkdown = (text: string): string =>
  text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[>#\-*+\d.]+\s+/gm, "")
    .replace(/[*_~]+/g, "");
