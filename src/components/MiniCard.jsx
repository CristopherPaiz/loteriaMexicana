import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const MiniCard = ({ number, index, totalCards, typeCard, isDisplayed }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isDisplayed) {
      setIsVisible(true);
    }
  }, [isDisplayed]);

  return (
    <div
      className="mini-card"
      style={{
        zIndex: totalCards - index,
        left: `${index * 20}px`,
        position: "relative",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.3s ease-in-out",
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
