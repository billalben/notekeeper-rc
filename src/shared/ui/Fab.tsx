interface FabProps {
  text?: string;
  label?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export const Fab = ({ text, label, disabled, onClick }: FabProps) => {
  return (
    <button
      className="fab"
      disabled={disabled}
      onClick={onClick}
      aria-label={label ?? text}
    >
      <span className="material-symbols-rounded" aria-hidden="true">
        add
      </span>
      {text && <span className="text text-label-large">{text}</span>}
      <div className="state-layer" />
    </button>
  );
};
