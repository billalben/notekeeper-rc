interface FabProps {
  text?: string;
  label?: string;
  disabled?: boolean;
  dataTour?: string;
  onClick?: () => void;
}

export const Fab = ({ text, label, disabled, dataTour, onClick }: FabProps) => {
  return (
    <button
      className="fab"
      disabled={disabled}
      onClick={onClick}
      aria-label={label ?? text}
      data-tour={dataTour}
    >
      <span className="material-symbols-rounded" aria-hidden="true">
        add
      </span>
      {text && <span className="text text-label-large">{text}</span>}
      <div className="state-layer" />
    </button>
  );
};
