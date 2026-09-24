import { useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { MaterialIcon } from "./MaterialIcon";
import { Tooltip } from "./Tooltip";
import { useTooltip } from "./useTooltip";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
  size?: "small" | "large";
  tooltip?: string;
  label?: string;
  children?: ReactNode;
}

export const IconButton = ({
  icon,
  size = "large",
  tooltip,
  label,
  children,
  className,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: IconButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { position, show, hide } = useTooltip();

  return (
    <>
      <button
        ref={buttonRef}
        className={`icon-btn ${size}${className ? ` ${className}` : ""}`}
        aria-label={label ?? tooltip}
        onMouseEnter={(event) => {
          if (tooltip) show(buttonRef.current);
          onMouseEnter?.(event);
        }}
        onMouseLeave={(event) => {
          hide();
          onMouseLeave?.(event);
        }}
        {...rest}
      >
        {children ?? <MaterialIcon name={icon ?? ""} />}
        <div className="state-layer" />
      </button>
      {tooltip && <Tooltip label={tooltip} position={position} />}
    </>
  );
};
