import PropTypes from "prop-types";
import { useEffect, useRef } from "react";
import VoiceButton from "./VoiceButton";

const RightPanel = ({ showMenu, activeVoice, handleVoiceChange, setShowMenu, setTime, time, typeCard, setTypeCard }) => {
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
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        width: "300px",
        height: "100vh",
        backgroundColor: "#ffffff",
        boxShadow: "-2px 0 10px rgba(0,0,0,0.1)",
        padding: "20px",
        transform: showMenu ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s ease-in-out",
        zIndex: 1000,
        overflowY: "auto",
      }}
    >
      <button
        onClick={() => setShowMenu(false)}
        style={{
          position: "absolute",
          right: "15px",
          top: "15px",
          background: "none",
          border: "none",
          fontSize: "24px",
          cursor: "pointer",
          width: "30px",
          height: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          transition: "background-color 0.2s ease",
          ":hover": {
            backgroundColor: "#f0f0f0f5",
          },
        }}
      >
        ×
      </button>

      <div style={{ marginTop: "30px" }}>
        <h3
          style={{
            color: "#333",
            fontSize: "1.2em",
            marginBottom: "15px",
            borderBottom: "2px solid #eee",
            paddingBottom: "10px",
          }}
        >
          Escoge tipo de voz
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          <VoiceButton voice="hombre" activeVoice={activeVoice} onClick={handleVoiceChange} />
          <VoiceButton voice="mujer" activeVoice={activeVoice} onClick={handleVoiceChange} />
          <VoiceButton voice="nino" activeVoice={activeVoice} onClick={handleVoiceChange} />
          <VoiceButton voice="joven" activeVoice={activeVoice} onClick={handleVoiceChange} />
        </div>

        <p
          style={{
            fontSize: "11px",
            color: "#666",
            margin: "15px 0",
            padding: "10px",
            backgroundColor: "#f9f9f9",
            borderRadius: "5px",
            lineHeight: "1.4",
          }}
        >
          * Para cambio de voz reinicia el juego, o espera dos turnos después de haber seleccionado para que cambie automaticamente
        </p>

        <h3
          style={{
            color: "#333",
            fontSize: "1.2em",
            marginTop: "25px",
            marginBottom: "15px",
            borderBottom: "2px solid #eee",
            paddingBottom: "10px",
          }}
        >
          Tiempo de cartas
        </h3>

        <input
          type="range"
          min="2"
          max="10"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          style={{
            width: "100%",
            height: "5px",
            borderRadius: "5px",
            appearance: "none",
            backgroundColor: "#ddd",
            outline: "none",
            "::-webkit-slider-thumb": {
              appearance: "none",
              width: "15px",
              height: "15px",
              borderRadius: "50%",
              backgroundColor: "#4CAF50",
              cursor: "pointer",
              transition: "transform 0.1s ease",
            },
            "::-webkit-slider-thumb:hover": {
              transform: "scale(1.2)",
            },
          }}
        />

        <p
          style={{
            color: "#666",
            textAlign: "center",
            margin: "10px 0",
          }}
        >{`${time} segundos`}</p>

        <h3
          style={{
            color: "#333",
            fontSize: "1.2em",
            marginTop: "25px",
            marginBottom: "15px",
            borderBottom: "2px solid #eee",
            paddingBottom: "10px",
          }}
        >
          Tipo de cartas
        </h3>

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
                padding: "10px 20px",
                border: "none",
                borderRadius: "5px",
                backgroundColor: typeCard === type ? "#4CAF50" : "#f0f0f0",
                color: typeCard === type ? "white" : "#333",
                cursor: "pointer",
                transition: "all 0.2s ease",
                transform: typeCard === type ? "scale(1.05)" : "scale(1)",
                ":hover": {
                  opacity: 0.9,
                  transform: "scale(1.05)",
                },
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
