import PropTypes from "prop-types";

const MiniCard = ({ number, index, totalCards, typeCard }) => (
  <div
    className="mini-card"
    style={{
      zIndex: totalCards - index,
      left: `${index * 20}px`, // Ajusta este valor para cambiar el espaciado horizontal
    }}
  >
    <img src={`/${typeCard}WEBP/${number}.webp`} alt={`Carta ${number}`} />
  </div>
);

MiniCard.propTypes = {
  number: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
  totalCards: PropTypes.number.isRequired,
  typeCard: PropTypes.string.isRequired,
};

export default MiniCard;
