import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import VoiceButton from "./VoiceButton";
import BingoCardGenerator from "./BingoCardGenerator";

const RightPanel = ({ showMenu, activeVoice, handleVoiceChange, setShowMenu, setTime, time, typeCard, setTypeCard }) => {
  const panelRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cierra el menú si se hace clic fuera del RightPanel
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
    <>
      <div ref={panelRef} className={`right-panel ${showMenu ? "show" : ""}`}>
        <button className="exit-button" style={{ position: "absolute", right: 5, top: 10 }} onClick={() => setShowMenu(false)}>
          X
        </button>
        <div style={{ height: "20px" }}></div>
        <h3 style={{ color: "black" }}>Escoge tipo de voz</h3>
        <VoiceButton voice="hombre" activeVoice={activeVoice} onClick={handleVoiceChange} />
        <VoiceButton voice="mujer" activeVoice={activeVoice} onClick={handleVoiceChange} />
        <VoiceButton voice="nino" activeVoice={activeVoice} onClick={handleVoiceChange} />
        <VoiceButton voice="joven" activeVoice={activeVoice} onClick={handleVoiceChange} />
        <p style={{ fontSize: "11px", color: "#000000", fontStyle: "bold" }}>
          * Para cambio de voz reinicia el juego, o espera dos turnos después de haber seleccionado para que cambie automaticamente
        </p>
        <hr />
        <h3 style={{ color: "black" }}>Tiempo de cartas</h3>
        <input style={{ width: "100%" }} type="range" min="2" max="10" value={time} onChange={(e) => setTime(e.target.value)} />
        <p style={{ color: "black" }}>{`${time} segundos`}</p>
        <hr />
        <h3 style={{ color: "black" }}>Tipo de cartas</h3>
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <button onClick={() => setTypeCard("HD")} style={{ backgroundColor: typeCard === "HD" ? "green" : "gray" }}>
            HD
          </button>
          <button onClick={() => setTypeCard("SD")} style={{ backgroundColor: typeCard === "SD" ? "green" : "gray" }}>
            Clásico
          </button>
        </div>
        <h3 style={{ color: "black" }}>Imprimir cartones</h3>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-500 text-white px-4 py-2 rounded">
          Abrir Generador de Cartones
        </button>
      </div>
      <BingoCardGenerator isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
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
