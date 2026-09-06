import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import CardImage from "./CardImage";

const PULSE_DURATION = 420;

const Card = ({ number, onClick, isPaused, typeCard, isPlaying, isImageLoaded, nextImageUrl, imageUrl }) => {
  // Determinar las clases de juego/pausa
  const cardStateClass = isPaused && isPlaying ? "paused" : "playing";

  // Al pausar la carta se encoge un pelín y al reanudar rebota hacia fuera:
  // confirma el toque sin necesidad de leer nada.
  const [pulse, setPulse] = useState(null);
  const previousPaused = useRef(isPaused);

  useEffect(() => {
    if (previousPaused.current === isPaused) return undefined;
    previousPaused.current = isPaused;

    if (!isPlaying) return undefined;

    setPulse(isPaused ? "pause" : "resume");
    const timer = setTimeout(() => setPulse(null), PULSE_DURATION);
    return () => clearTimeout(timer);
  }, [isPaused, isPlaying]);

  return (
    <div className={`loteria-card-container ${pulse ? `is-${pulse}` : ""}`} onClick={onClick}>
      {/* Carta actual */}
      <div className={`loteria-card loteria-card-current ${cardStateClass}`}>
        <CardImage
          card={number}
          typeCard={typeCard}
          getCardImageUrl={() => imageUrl}
          alt={`Carta ${number}`}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            // El contenedor ya usa la proporción real del archivo; cover evita
            // franjas por el medio píxel de diferencia entre HD y SD.
            objectFit: "cover",
            opacity: isPlaying ? (isPaused ? 0.5 : 1) : 1,
          }}
        />
      </div>

      {/* Imagen precargada (invisible) */}
      {isPlaying && isImageLoaded && (
        <img
          src={nextImageUrl}
          alt=""
          aria-hidden="true"
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
