import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { rehypeHighlightSubset } from "@/shared/markdown/rehypeHighlightSubset";

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // GFM task lists need the checkbox state; the default schema only keeps
    // `type` and `disabled`, which would drop completed items.
    input: [...(defaultSchema.attributes?.input ?? []), "checked"],
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ["className", /^language-./],
    ],
    span: [...(defaultSchema.attributes?.span ?? []), ["className", /^hljs-/]],
  },
};

interface MarkdownRendererProps {
  text: string;
  className?: string;
}

const MarkdownRenderer = memo(({ text, className }: MarkdownRendererProps) => (
  <div className={className}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeSanitize, sanitizeSchema], rehypeHighlightSubset]}
      components={{
        a: ({ node: _node, ...props }) => (
          <a {...props} target="_blank" rel="noopener noreferrer" />
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  </div>
));

MarkdownRenderer.displayName = "MarkdownRenderer";

export default MarkdownRenderer;
