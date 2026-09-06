import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import CardImage from "./CardImage";

const MiniCard = ({ number, index, totalCards, typeCard, isDisplayed, imageUrl, animate = true }) => {
  const [isVisible, setIsVisible] = useState(!animate);

  useEffect(() => {
    if (animate && isDisplayed) {
      // Retraso escalonado para crear efecto en cascada. Se cuenta desde el
      // extremo derecho, que es donde entra la carta recién cantada.
      const timer = setTimeout(() => setIsVisible(true), 100 + (totalCards - 1 - index) * 50);
      return () => clearTimeout(timer);
    } else if (!animate) {
      setIsVisible(true);
    }
  }, [isDisplayed, index, totalCards, animate]);

  return (
    <div
      className="mini-card"
      data-card={number}
      style={{
        // Se reparten de izquierda a derecha: la más nueva va a la derecha y
        // queda encima del montón.
        zIndex: index + 1,
        left: `${index * 2}px`,
        position: "relative",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.4s ease-in-out, transform 0.5s ease-out",
      }}
    >
      <CardImage card={number} typeCard={typeCard} getCardImageUrl={() => imageUrl} alt={`Carta ${number}`} />
    </div>
  );
};

MiniCard.propTypes = {
  number: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
  totalCards: PropTypes.number.isRequired,
  typeCard: PropTypes.string.isRequired,
  isDisplayed: PropTypes.bool.isRequired,
  imageUrl: PropTypes.string,
  animate: PropTypes.bool,
};

export default MiniCard;
