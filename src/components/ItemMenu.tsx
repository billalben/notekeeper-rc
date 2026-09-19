import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export interface ItemMenuItem {
  key: string;
  label: string;
  icon: string;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
  separatorBefore?: boolean;
}

interface ItemMenuProps {
  label: string;
  items: ItemMenuItem[];
  children?: ReactNode;
}

export const ItemMenu = ({ label, items, children }: ItemMenuProps) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  const close = () => setPosition(null);

  const open = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPosition({ top: rect.bottom + 4, left: rect.right });
  };

  useEffect(() => {
    if (!position) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [position]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`icon-btn small item-menu-trigger${
          position ? " active" : ""
        }`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={position ? "true" : "false"}
        onClick={(event) => {
          event.stopPropagation();
          if (position) close();
          else open();
        }}
      >
        {children ?? (
          <span className="material-symbols-rounded" aria-hidden="true">
            more_vert
          </span>
        )}
        <div className="state-layer" />
      </button>

      {position &&
        createPortal(
          <div
            ref={menuRef}
            className="item-menu"
            role="menu"
            aria-label={label}
            style={{
              top: position.top,
              left: position.left,
              transform: "translateX(-100%)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className={`item-menu-action${item.danger ? " danger" : ""}${
                  item.separatorBefore ? " separated" : ""
                }`}
                disabled={item.disabled}
                onClick={(event) => {
                  event.stopPropagation();
                  close();
                  item.onSelect();
                }}
              >
                <span className="material-symbols-rounded" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="text-label-large">{item.label}</span>
                <div className="state-layer" />
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
};
