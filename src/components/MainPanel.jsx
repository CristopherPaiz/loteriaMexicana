import PropTypes from "prop-types";
import Card from "./Card";
import { FaPlay, FaForward, FaUndo, FaUsers } from "react-icons/fa";

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
  nextImageUrl,
  getCardImageUrl,
  cardAnimation,
  onOpenMultiplayer,
  isPlayerDevice = false,
}) => (
  <div className="main-panel">
    {/* Hueco elástico: la carta se queda con el espacio sobrante */}
    <div className="lot-card-slot">
      <Card
        number={currentCard}
        onClick={togglePlay}
        isPaused={isPaused}
        typeCard={typeCard}
        isPlaying={isPlaying}
        isImageLoaded={isImageLoaded}
        nextImageUrl={nextImageUrl}
        getCardImageUrl={getCardImageUrl}
        cardAnimation={cardAnimation}
      />
    </div>

    <p className="lot-hint">Toca la carta para {isPlaying ? (isPaused ? "reanudar" : "pausar") : "comenzar"}</p>

    <div className="lot-actions">
      {isPlaying ? (
        <>
          <button type="button" className="lot-btn lot-btn--next" onClick={drawNextCard} disabled={isPaused}>
            <FaForward />
            <span className="lot-btn__label">Siguiente carta</span>
          </button>

          {/* En pantallas bajas este botón se queda solo con el icono: el
              aria-label mantiene el nombre accesible. */}
          <button type="button" className="lot-btn lot-btn--danger" onClick={stopGame} aria-label="Reiniciar juego">
            <FaUndo />
            <span className="lot-btn__label">Reiniciar juego</span>
          </button>
        </>
      ) : (
        <>
          <button type="button" className="lot-btn lot-btn--start is-idle" onClick={startGame}>
            <FaPlay />
            <span className="lot-btn__label">Iniciar juego</span>
          </button>

          {/* El multijugador vivía solo dentro de los ajustes y no lo
              encontraba nadie. Aquí, junto a "Iniciar", es donde se decide
              si se juega solo o con más gente. */}
          <button type="button" className="lot-btn lot-btn--multi" onClick={onOpenMultiplayer}>
            <FaUsers />
            <span className="lot-btn__label">{isPlayerDevice ? "Mi cartón" : "Multijugador"}</span>
          </button>
        </>
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
  getCardImageUrl: PropTypes.func.isRequired,
  cardAnimation: PropTypes.string.isRequired,
  onOpenMultiplayer: PropTypes.func.isRequired,
  isPlayerDevice: PropTypes.bool,
};
