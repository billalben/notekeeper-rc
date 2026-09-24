interface MaterialIconProps {
  /** Icon ligature name, e.g. `push_pin`, `delete`. */
  name: string;
  className?: string;
  /** Native tooltip; also exposes the icon to assistive tech. */
  title?: string;
  /** Accessible label. When omitted (and no `title`) the icon is decorative. */
  label?: string;
}

/**
 * Renders a Material Symbols glyph. Decorative by default so it never becomes
 * an unnamed, focusable stop for screen readers.
 */
export const MaterialIcon = ({
  name,
  className,
  title,
  label,
}: MaterialIconProps) => {
  const isDecorative = !title && !label;

  return (
    <span
      className={`material-symbols-rounded${className ? ` ${className}` : ""}`}
      title={title}
      aria-label={label}
      aria-hidden={isDecorative ? "true" : undefined}
    >
      {name}
    </span>
  );
};
