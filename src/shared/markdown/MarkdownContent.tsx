import { lazy, memo, Suspense } from "react";
import { PlainText } from "@/shared/markdown/PlainText";

const MarkdownRenderer = lazy(() => import("./MarkdownRenderer"));

export interface MarkdownContentProps {
  text: string;
  className?: string;
}

/**
 * Public entry point for rendering markdown. The heavy renderer (react-markdown,
 * remark-gfm, rehype-sanitize and the syntax highlighter, ~320 KB) is loaded
 * lazily so it stays out of the initial bundle; plain text is shown until it
 * arrives.
 */
export const MarkdownContent = memo(
  ({ text, className }: MarkdownContentProps) => (
    <Suspense fallback={<PlainText text={text} className={className} />}>
      <MarkdownRenderer text={text} className={className} />
    </Suspense>
  ),
);

MarkdownContent.displayName = "MarkdownContent";
