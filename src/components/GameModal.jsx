import PropTypes from "prop-types";
import { FaCheck, FaTimes } from "react-icons/fa";

const GameModal = ({ isOpen, title, children, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar", showCancel = true }) => {
  if (!isOpen) return null;

  return (
    <div className="game-modal-overlay">
      <div className="game-modal-content">
        <h2 className="game-modal-title">{title}</h2>
        <div className="game-modal-body">{children}</div>
        <div className="game-modal-actions">
          {showCancel && (
            <button className="game-modal-button cancel" onClick={onCancel}>
              <FaTimes style={{ marginRight: "8px" }} /> {cancelText}
            </button>
          )}
          <button className="game-modal-button confirm" onClick={onConfirm}>
            <FaCheck style={{ marginRight: "8px" }} /> {confirmText}
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

        .game-modal-button {
          padding: 12px 24px;
          border: none;
          border-radius: 30px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          font-size: 1rem;
          min-width: 120px;
          justify-content: center;
        }

        .game-modal-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .game-modal-button:active {
          transform: translateY(0);
        }

        .game-modal-button.confirm {
          background: linear-gradient(90deg, #4CAF50, #45a049);
          color: white;
        }

        .game-modal-button.cancel {
          background-color: transparent;
          border: 1px solid #ff5252;
          color: #ff5252;
        }

        .game-modal-button.cancel:hover {
            background-color: rgba(255, 82, 82, 0.1);
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
