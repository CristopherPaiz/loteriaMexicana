import PropTypes from "prop-types";
import { FaCheck, FaTimes } from "react-icons/fa";
import useModalDismiss from "../multiplayer/useModalDismiss";

const GameModal = ({ isOpen, title, children, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar", showCancel = true }) => {
  // El botón "atrás" del teléfono cierra el modal, no la app.
  useModalDismiss(isOpen, () => onCancel?.());

  if (!isOpen) return null;

  return (
    <div className="game-modal-overlay">
      <div className="game-modal-content">
        <h2 className="game-modal-title">{title}</h2>
        <div className="game-modal-body">{children}</div>
        <div className="game-modal-actions">
          {showCancel && (
            <button type="button" className="lot-btn lot-btn--ghost" onClick={onCancel}>
              <FaTimes /> {cancelText}
            </button>
          )}
          <button type="button" className="lot-btn lot-btn--start" onClick={onConfirm}>
            <FaCheck /> {confirmText}
          </button>
        </div>
      </div>
      <style>{`
        .game-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 20000;
          backdrop-filter: blur(5px);
          animation: fadeIn 0.3s ease-out;
        }

        .game-modal-content {
          background: linear-gradient(145deg, #2b2f3a, #1a1d24);
          padding: 30px;
          border-radius: 20px;
          width: 90%;
          max-width: 450px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
          color: white;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
          animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          margin: 20px;
          max-height: calc(100dvh - 40px);
          overflow-y: auto;
        }

        .game-modal-title {
          margin-top: 0;
          margin-bottom: 20px;
          font-size: 1.8rem;
          color: #fff;
          font-weight: 700;
        }

        .game-modal-body {
          margin-bottom: 30px;
          font-size: 1.1rem;
          color: #ccc;
          line-height: 1.6;
        }

        .game-modal-actions {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .game-modal-actions .lot-btn {
          min-width: 140px;
        }

        /* En móvil los dos botones se quedan en una sola fila: se reparten el
           ancho y el texto puede partirse dentro del botón. */
        @media (max-width: 600px) {
          .game-modal-content {
            padding: 24px 18px;
            margin: 14px;
          }

          .game-modal-actions {
            flex-wrap: nowrap;
            gap: 10px;
          }

          .game-modal-actions .lot-btn {
            flex: 1 1 0;
            min-width: 0;
            padding: 12px 10px;
            gap: 6px;
            font-size: 0.85rem;
            line-height: 1.25;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

GameModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  showCancel: PropTypes.bool,
};

export default GameModal;
