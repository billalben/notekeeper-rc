import { createPortal } from "react-dom";
import type { TooltipPosition } from "./useTooltip";

interface TooltipProps {
  label: string;
  position: TooltipPosition | null;
}

/** Floating label rendered through a portal so overflow containers never clip it. */
export const Tooltip = ({ label, position }: TooltipProps) => {
  if (!position) return null;

  return createPortal(
    <span
      className="tooltip text-body-small"
      style={{
        top: position.top,
        left: position.left,
        transform: "translate(-50%, 0)",
      }}
    >
      {label}
    </span>,
    document.body,
  );
};
