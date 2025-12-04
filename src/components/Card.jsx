import PropTypes from "prop-types";

const Card = ({ number, onClick, isPaused, typeCard, isPlaying, isImageLoaded, nextImageUrl, imageUrl }) => {
  // URL de la imagen actual
  const currentImageUrl = imageUrl || `/${typeCard}WEBP/${number}.webp`;

  // Determinar las clases de juego/pausa
  const cardStateClass = isPaused && isPlaying ? "paused" : "playing";

  return (
    <div className="loteria-card-container" onClick={onClick}>
      {/* Carta actual */}
      <div className={`loteria-card loteria-card-current ${cardStateClass}`}>
        <img
          src={currentImageUrl}
          alt={`Carta ${number}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            opacity: isPlaying ? (isPaused ? 0.5 : 1) : 1,
          }}
        />
      </div>

      {/* Imagen precargada (invisible) */}
      {isPlaying && isImageLoaded && (
        <img
          src={nextImageUrl}
          alt="Next card"
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            opacity: 0,
            visibility: "hidden",
          }}
        />
      )}
    </div>
  );
};

export default Card;

Card.propTypes = {
  number: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
  isPaused: PropTypes.bool.isRequired,
  typeCard: PropTypes.string.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  isImageLoaded: PropTypes.bool.isRequired,
  nextImageUrl: PropTypes.string.isRequired,
  imageUrl: PropTypes.string,
};
