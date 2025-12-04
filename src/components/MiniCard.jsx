import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const MiniCard = ({ number, index, totalCards, typeCard, isDisplayed, imageUrl, animate = true }) => {
  const [isVisible, setIsVisible] = useState(!animate);

  useEffect(() => {
    if (animate && isDisplayed) {
      // Retraso escalonado para crear efecto en cascada
      const timer = setTimeout(() => setIsVisible(true), 100 + index * 50);
      return () => clearTimeout(timer);
    } else if (!animate) {
      setIsVisible(true);
    }
  }, [isDisplayed, index, animate]);

  const currentImageUrl = imageUrl || `/${typeCard}WEBP/${number}.webp`;

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
      <img src={currentImageUrl} alt={`Carta ${number}`} />
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
