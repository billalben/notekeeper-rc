interface ConfirmModalProps {
  title: string;
  onConfirm: (isConfirm: boolean) => void;
}

export const ConfirmModal = ({ title, onConfirm }: ConfirmModalProps) => {
  return (
    <>
      <div className="modal">
        <h3 className="modal-title text-title-medium">
          Are you sure you want to delete <strong>"{title}"</strong> ?
        </h3>
        <div className="modal-footer">
          <button
            className="btn text"
            type="button"
            onClick={() => onConfirm(false)}
          >
            <span className="text-label-large">Cancel</span>
            <div className="state-layer" />
          </button>
          <button
            className="btn fill"
            type="button"
            onClick={() => onConfirm(true)}
          >
            <span className="text-label-large">Delete</span>
            <div className="state-layer" />
          </button>
        </div>
      </div>
      <div className="overlay modal-overlay" />
    </>
  );
};
