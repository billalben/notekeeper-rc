import { useCallback, useState } from "react";

const GAP = 4;

export interface TooltipPosition {
  top: number;
  left: number;
}

/** Positions a tooltip below an anchor element; call from show/hide handlers. */
export const useTooltip = () => {
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const show = useCallback((anchor: HTMLElement | null) => {
    if (!anchor) return;
    const { top, left, height, width } = anchor.getBoundingClientRect();
    setPosition({ top: top + height + GAP, left: left + width / 2 });
  }, []);

  const hide = useCallback(() => setPosition(null), []);

  return { position, show, hide };
};
