import { useEffect } from "react";
import PropTypes from "prop-types";
import useBackToClose from "../../multiplayer/useBackToClose";

/**
 * Confirmación como modal encima del modal que la pidió.
 *
 * Antes esto se desplegaba dentro del propio panel y empujaba todo lo demás
 * hacia abajo; una decisión de sí o no merece quedarse quieta y encima.
 */
const ConfirmModal = ({ isOpen, title, children, confirmText, cancelText = "Mejor no", onConfirm, onCancel, tone = "danger" }) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  useBackToClose(isOpen, onCancel);

  if (!isOpen) return null;

  return (
    <div className="lot-modal-overlay lot-modal-overlay--top" onClick={onCancel} role="presentation">
      <div className="lot-modal mp-ask" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-label={title}>
        <div className="mp-ask__body">
          <h3 className="mp-ask__title">{title}</h3>
          <p className="mp-ask__text">{children}</p>
        </div>

        <div className="mp-ask__actions">
          <button type="button" className="lot-btn lot-btn--ghost" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className={`lot-btn lot-btn--${tone}`} onClick={onConfirm} autoFocus>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  confirmText: PropTypes.string.isRequired,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  tone: PropTypes.oneOf(["danger", "start", "next"]),
};

export default ConfirmModal;
