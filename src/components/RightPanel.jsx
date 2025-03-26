import PropTypes from "prop-types";
import { useEffect, useRef } from "react";
import VoiceButton from "./VoiceButton";
import { FaTimes } from "react-icons/fa";

const RightPanel = ({ 
  showMenu, 
  activeVoice, 
  handleVoiceChange, 
  setShowMenu, 
  setTime, 
  time, 
  typeCard, 
  setTypeCard 
}) => {
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setShowMenu]);

  return (
    <div
      ref={panelRef}
      className={`right-panel ${showMenu ? "show" : ""}`}
    >
      <button
        className="close"
        onClick={() => setShowMenu(false)}
        aria-label="Cerrar menú"
      >
        <FaTimes />
      </button>

      <div style={{ marginTop: "30px" }}>
        <h3>Escoge tipo de voz</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <VoiceButton voice="hombre" activeVoice={activeVoice} onClick={handleVoiceChange} />
          <VoiceButton voice="mujer" activeVoice={activeVoice} onClick={handleVoiceChange} />
          <VoiceButton voice="nino" activeVoice={activeVoice} onClick={handleVoiceChange} />
          <VoiceButton voice="joven" activeVoice={activeVoice} onClick={handleVoiceChange} />
        </div>

        <p
          style={{
            fontSize: "11px",
            color: "#ffffff",
            margin: "15px 0",
            padding: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "5px",
            lineHeight: "1.4",
          }}
        >
          * Para cambio de voz reinicia el juego, o espera dos turnos después de haber seleccionado para que cambie automáticamente
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
          }}
        />

        <p
          style={{
            color: "#ffffff",
            textAlign: "center",
            margin: "10px 0",
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
          }}
        >
          {["HD", "SD"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeCard(type)}
              style={{
                padding: "12px 25px",
                border: "none",
                borderRadius: "5px",
                backgroundColor: typeCard === type ? "#4CAF50" : "rgba(255, 255, 255, 0.2)",
                color: "white",
                cursor: "pointer",
                transition: "all 0.3s ease",
                transform: typeCard === type ? "scale(1.05)" : "scale(1)",
                fontWeight: typeCard === type ? "bold" : "normal",
                boxShadow: typeCard === type ? "0 4px 8px rgba(0, 0, 0, 0.2)" : "none",
              }}
            >
              {type === "SD" ? "Clásico" : type}
            </button>
          ))}
        </div>
      </div>
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
};

export default RightPanel;