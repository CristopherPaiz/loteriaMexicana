import PropTypes from "prop-types";

const Card = ({ number, onClick, isPaused, typeCard, isPlaying, isImageLoaded, nextImageUrl }) => {
  const currentImageUrl = `/${typeCard}WEBP/${number}.webp`;

  return (
    <div className={`card ${isPaused && isPlaying ? "paused" : "playing"}`} onClick={onClick} style={{ position: "relative" }}>
      <img
        src={currentImageUrl}
        alt={`Carta ${number}`}
        style={{
          opacity: isPlaying ? (isPaused ? 0.5 : 1) : 1,
          transition: "opacity 0.3s ease-in-out",
        }}
      />
      {isPlaying && (
        <>
          {isImageLoaded ? (
            <img
              src={nextImageUrl}
              alt="Next card"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "gray",
                opacity: 0,
              }}
            />
          )}
        </>
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
};
