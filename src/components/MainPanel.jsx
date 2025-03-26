import PropTypes from "prop-types";
import Card from "./Card";
import { FaPlay, FaForward, FaUndo } from "react-icons/fa";

const MainPanel = ({ 
  currentCard, 
  togglePlay, 
  startGame, 
  drawNextCard, 
  stopGame, 
  isPlaying, 
  isPaused, 
  typeCard, 
  isImageLoaded, 
  nextImageUrl 
}) => (
  <div className="main-panel">
    {/* Contenedor con posición relativa para el Card */}
    <div style={{ position: "relative", marginBottom: "20px" }}>
      <Card
        number={currentCard}
        onClick={togglePlay}
        isPaused={isPaused}
        typeCard={typeCard}
        isPlaying={isPlaying}
        isImageLoaded={isImageLoaded}
        nextImageUrl={nextImageUrl}
      />
    </div>
    
    <p style={{ 
      textAlign: "center", 
      margin: "10px 0", 
      fontSize: "14px",
      opacity: 0.8,
      color: "white" 
    }}>
      * Toca la carta para {isPlaying ? (isPaused ? "reanudar" : "pausar") : "comenzar"}
    </p>
    
    <div style={{
      width: "100%",
      maxWidth: "300px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      marginTop: "10px"
    }}>
      {isPlaying ? (
        <>
          <button 
            style={{
              backgroundColor: "#2196F3",
              color: "white",
              borderRadius: "30px",
              padding: "12px 20px",
              border: "none",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isPaused ? "not-allowed" : "pointer",
              opacity: isPaused ? 0.7 : 1,
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
              transition: "all 0.3s"
            }}
            onClick={drawNextCard}
            disabled={isPaused}
          >
            <FaForward style={{ marginRight: "8px" }} /> Siguiente carta
          </button>
          
          <button 
            style={{
              backgroundColor: "#F44336",
              color: "white",
              borderRadius: "30px",
              padding: "12px 20px",
              border: "none",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
              transition: "all 0.3s"
            }}
            onClick={stopGame}
          >
            <FaUndo style={{ marginRight: "8px" }} /> Reiniciar juego
          </button>
        </>
      ) : (
        <button 
          style={{
            backgroundColor: "#4CAF50",
            color: "white",
            borderRadius: "30px",
            padding: "12px 20px",
            border: "none",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
            transition: "all 0.3s",
            animation: "pulse 1.5s infinite"
          }}
          onClick={startGame}
        >
          <FaPlay style={{ marginRight: "8px" }} /> Iniciar juego
        </button>
      )}
    </div>
  </div>
);

export default MainPanel;

MainPanel.propTypes = {
  currentCard: PropTypes.number.isRequired,
  togglePlay: PropTypes.func.isRequired,
  startGame: PropTypes.func.isRequired,
  drawNextCard: PropTypes.func.isRequired,
  stopGame: PropTypes.func.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  isPaused: PropTypes.bool.isRequired,
  typeCard: PropTypes.string.isRequired,
  isImageLoaded: PropTypes.bool.isRequired,
  nextImageUrl: PropTypes.string.isRequired,
};