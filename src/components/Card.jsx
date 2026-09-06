import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import CardImage from "./CardImage";

// Debe quedar holgadamente por debajo del tiempo mínimo entre cartas (3 s).
const TRANSITION_MS = 520;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const Card = ({ number, onClick, isPaused, typeCard, isPlaying, isImageLoaded, nextImageUrl, getCardImageUrl, cardAnimation }) => {
  const isHeld = isPaused && isPlaying;
  const cardStateClass = isHeld ? "paused" : "playing";

  // Capa saliente: la carta anterior se mantiene montada mientras dura la
  // transición, para que salida y entrada convivan un instante.
  const [outgoing, setOutgoing] = useState(null);
  const [pass, setPass] = useState(0);
  const previousNumber = useRef(number);

  useEffect(() => {
    if (previousNumber.current === number) return undefined;

    const leaving = previousNumber.current;
    previousNumber.current = number;

    if (cardAnimation === "none" || prefersReducedMotion()) {
      setOutgoing(null);
      return undefined;
    }

    // `pass` reinicia la animación aunque se encadenen dos cambios seguidos.
    setOutgoing(leaving);
    setPass((prev) => prev + 1);

    const timer = setTimeout(() => setOutgoing(null), TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [number, cardAnimation]);

  const isAnimating = outgoing !== null;
  const animationClass = cardAnimation === "none" ? "" : `anim-${cardAnimation}`;

  return (
    // Mientras está pausada la carta se queda un poco más pequeña, y al
    // reanudar vuelve a su tamaño. El estado se ve, no solo el toque.
    <div className={`loteria-card-container ${animationClass} ${isHeld ? "is-held" : ""}`} onClick={onClick}>
      {/* Carta que se va */}
      {isAnimating && (
        <div key={`saliente-${pass}`} className="loteria-card loteria-card-previous playing is-exiting" aria-hidden="true">
          <CardImage
            card={outgoing}
            typeCard={typeCard}
            getCardImageUrl={getCardImageUrl}
            alt=""
            style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      {/* Carta actual */}
      <div className={`loteria-card loteria-card-current ${cardStateClass} ${isAnimating ? "is-entering" : ""}`}>
        <CardImage
          card={number}
          typeCard={typeCard}
          getCardImageUrl={getCardImageUrl}
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
  getCardImageUrl: PropTypes.func.isRequired,
  cardAnimation: PropTypes.string.isRequired,
};
