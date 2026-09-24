import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "fill" | "text";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Destructive styling, typically paired with `variant="fill"`. */
  danger?: boolean;
  children: ReactNode;
}

/** Shared `btn` with the Material state-layer overlay baked in. */
export const Button = ({
  variant = "text",
  danger = false,
  className,
  children,
  ...rest
}: ButtonProps) => (
  <button
    type="button"
    className={`btn ${variant}${danger ? " danger" : ""}${
      className ? ` ${className}` : ""
    }`}
    {...rest}
  >
    <span className="text-label-large">{children}</span>
    <div className="state-layer" />
  </button>
);
