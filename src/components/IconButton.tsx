import {
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

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
  ...rest
}: IconButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const showTooltip = () => {
    const button = buttonRef.current;
    if (!tooltip || !button) return;
    const { top, left, height, width } = button.getBoundingClientRect();
    setTooltipPosition({ top: top + height + 4, left: left + width / 2 });
  };

  const hideTooltip = () => setTooltipPosition(null);

  return (
    <>
      <button
        ref={buttonRef}
        className={`icon-btn ${size}${className ? ` ${className}` : ""}`}
        aria-label={label ?? tooltip}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        {...rest}
      >
        {children ?? (
          <span className="material-symbols-rounded" aria-hidden="true">
            {icon}
          </span>
        )}
        <div className="state-layer" />
      </button>
      {tooltip &&
        tooltipPosition &&
        createPortal(
          <span
            className="tooltip text-body-small"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              transform: "translate(-50%, 0)",
            }}
          >
            {tooltip}
          </span>,
          document.body,
        )}
    </>
  );
};
