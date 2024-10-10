import PropTypes from "prop-types";
import Card from "./Card";

const MainPanel = ({ currentCard, togglePlay, startGame, drawNextCard, stopGame, isPlaying, isPaused, typeCard, isImageLoaded, nextImageUrl }) => (
  <div className="main-panel">
    <Card
      number={currentCard}
      onClick={togglePlay}
      isPaused={isPaused}
      typeCard={typeCard}
      isPlaying={isPlaying}
      isImageLoaded={isImageLoaded}
      nextImageUrl={nextImageUrl}
    />
    <div
      style={{
        height: "100px",
        gap: "5px",
        width: "290px",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      {isPlaying ? <button onClick={drawNextCard}>Siguiente carta</button> : null}
      {!isPlaying ? (
        <button onClick={startGame}>Iniciar juego</button>
      ) : (
        <button style={{ backgroundColor: "red" }} onClick={stopGame}>
          Reiniciar
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
