import PropTypes from "prop-types";
import { useEffect, useRef } from "react";
import VoiceButton from "./VoiceButton";
import { FaTimes } from "react-icons/fa";

const RightPanel = ({ showMenu, activeVoice, handleVoiceChange, setShowMenu, setTime, time, typeCard, setTypeCard, onOpenGenerator }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target) && showMenu) {
        setShowMenu(false);
      }
    };

    // Usamos mousedown para detectar el clic antes de que se procese en otros elementos
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setShowMenu, showMenu]);

  return (
    <div ref={panelRef} className={`right-panel ${showMenu ? "show" : ""}`}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          paddingBottom: "20px",
        }}
      >
        <button
          className="close"
          onClick={() => setShowMenu(false)}
          aria-label="Cerrar menú"
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "1.5rem",
            cursor: "pointer",
            padding: "5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FaTimes />
        </button>
      </div>

      <div style={{ marginTop: "10px" }}>
        <h3>Escoge tipo de voz</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <VoiceButton voice="hombre" activeVoice={activeVoice} onClick={handleVoiceChange} />
          <VoiceButton voice="mujer" activeVoice={activeVoice} onClick={handleVoiceChange} />
          <VoiceButton voice="nino" activeVoice={activeVoice} onClick={handleVoiceChange} />
          <VoiceButton voice="joven" activeVoice={activeVoice} onClick={handleVoiceChange} />
        </div>

        <p
          style={{
            fontSize: "12px",
            color: "#e0e0e0",
            margin: "15px 0",
            padding: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "5px",
            lineHeight: "1.4",
          }}
        >
          * Para cambio de voz reinicia el juego, o espera dos turnos.
        </p>

        <h3>Tiempo de cartas</h3>

        <input
          type="range"
          min="3"
          max="10"
          value={time}
          onChange={(e) => setTime(parseInt(e.target.value))}
          style={{
            width: "100%",
            cursor: "pointer",
            accentColor: "#4CAF50",
            height: "6px",
            marginBottom: "10px",
          }}
        />

        <p
          style={{
            color: "#ffffff",
            textAlign: "center",
            margin: "0 0 20px 0",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >{`${time} segundos`}</p>

        <h3>Tipo de cartas</h3>

        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            marginBottom: "30px",
          }}
        >
          {["HD", "SD"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeCard(type)}
              style={{
                padding: "10px 20px",
                border: "none",
                borderRadius: "5px",
                backgroundColor: typeCard === type ? "#4CAF50" : "rgba(255, 255, 255, 0.15)",
                color: "white",
                cursor: "pointer",
                transition: "all 0.2s ease",
                transform: typeCard === type ? "scale(1.05)" : "scale(1)",
                fontWeight: typeCard === type ? "bold" : "normal",
                boxShadow: typeCard === type ? "0 2px 4px rgba(0, 0, 0, 0.3)" : "none",
              }}
            >
              {type === "SD" ? "Clásico" : type}
            </button>
          ))}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "20px" }}>
          <button
            onClick={onOpenGenerator}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#d32f2f",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
              transition: "transform 0.2s, background-color 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              fontSize: "14px",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#b71c1c")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#d32f2f")}
          >
            <span>🖨️</span> Generador de Cartones
          </button>
        </div>
      </div>

      <style>{`
        .right-panel {
          background-color: #1a1d24 !important; /* Fondo oscuro para mejor contraste */
          box-shadow: -5px 0 25px rgba(0,0,0,0.7);
          color: #f0f0f0;
          overflow-y: auto; /* Permitir scroll si el contenido es alto */
        }
        .right-panel h3 {
          color: #ffffff;
          border-bottom: 2px solid #4CAF50;
          padding-bottom: 5px;
          margin-bottom: 15px;
          margin-top: 20px;
          font-size: 1.1rem;
          letter-spacing: 0.5px;
        }
        /* Scrollbar styling */
        .right-panel::-webkit-scrollbar {
          width: 6px;
        }
        .right-panel::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        .right-panel::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
};

RightPanel.propTypes = {
  showMenu: PropTypes.bool.isRequired,
  activeVoice: PropTypes.string.isRequired,
  handleVoiceChange: PropTypes.func.isRequired,
  setShowMenu: PropTypes.func.isRequired,
  setTime: PropTypes.func.isRequired,
  time: PropTypes.number.isRequired,
  typeCard: PropTypes.string.isRequired,
  setTypeCard: PropTypes.func.isRequired,
  onOpenGenerator: PropTypes.func.isRequired,
};

export default RightPanel;
