import { memo } from "react";
import { stripMarkdown } from "@/shared/lib/text";

export interface PlainTextProps {
  text: string;
  className?: string;
}

/**
 * Instant, dependency-free fallback shown while the markdown renderer chunk
 * loads. Uses the same outer element/classes as the renderer so the layout
 * does not shift when it upgrades.
 */
export const PlainText = memo(({ text, className }: PlainTextProps) => (
  <div className={className}>{stripMarkdown(text)}</div>
));

PlainText.displayName = "PlainText";
