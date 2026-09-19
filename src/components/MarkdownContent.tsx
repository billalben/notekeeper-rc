import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import { common } from "lowlight";

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

interface MarkdownContentProps {
  text: string;
  className?: string;
}

export const MarkdownContent = memo(
  ({ text, className }: MarkdownContentProps) => (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeSanitize, sanitizeSchema],
          [rehypeHighlight, { languages: common, detect: false }],
        ]}
        components={{
          a: ({ node: _node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  ),
);

MarkdownContent.displayName = "MarkdownContent";
