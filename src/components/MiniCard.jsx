import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const MiniCard = ({ number, index, totalCards, typeCard, isDisplayed }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isDisplayed) {
      // Retraso escalonado para crear efecto en cascada
      setTimeout(() => setIsVisible(true), 100 + index * 50);
    }
  }, [isDisplayed, index]);

  return (
    <div
      className="mini-card"
      style={{
        zIndex: totalCards - index,
        left: `${index * 2}px`,
        position: "relative",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.4s ease-in-out, transform 0.5s ease-out",
      }}
    >
      <img src={`/${typeCard}WEBP/${number}.webp`} alt={`Carta ${number}`} />
    </div>
  );
};

MiniCard.propTypes = {
  number: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
  totalCards: PropTypes.number.isRequired,
  typeCard: PropTypes.string.isRequired,
  isDisplayed: PropTypes.bool.isRequired,
};

export default MiniCard;