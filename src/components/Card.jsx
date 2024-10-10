import PropTypes from "prop-types";

const Card = ({ number, onClick, isPaused, typeCard, isPlaying }) => (
  <div className={`card ${isPaused && isPlaying ? "paused" : "playing"}`} onClick={onClick}>
    <img src={`/${typeCard}WEBP/${number}.webp`} alt={`Carta ${number}`} />
  </div>
);

export default Card;

Card.propTypes = {
  number: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
  isPaused: PropTypes.bool.isRequired,
  typeCard: PropTypes.string.isRequired,
  isPlaying: PropTypes.bool.isRequired,
};
