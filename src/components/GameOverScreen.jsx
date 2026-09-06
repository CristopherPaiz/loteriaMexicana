import PropTypes from "prop-types";
import { FaTrophy, FaRedo } from "react-icons/fa";
import CardImage from "./CardImage";

// Máximo de cartas a las que se les escalona la entrada: más allá, la cascada
// se hace larga y estorba en vez de lucir.
const STAGGER_LIMIT = 30;

const GameOverScreen = ({ cards, typeCard, getCardImageUrl, onRestart }) => (
  <section className="lot-end">
    <header className="lot-end__head">
      <span className="lot-end__badge" aria-hidden="true">
        <FaTrophy />
      </span>
      <h2 className="lot-end__title">¡Se acabó la baraja!</h2>
      <p className="lot-end__subtitle">
        Salieron las {cards.length} cartas. Revisen los cartones antes de volver a empezar.
      </p>
    </header>

    <div className="lot-end__body">
      <div className="lot-history">
        {cards.map((card, index) => (
          <div
            key={card}
            className="lot-history__item"
            style={{ animationDelay: `${Math.min(index, STAGGER_LIMIT) * 14}ms` }}
          >
            <div className="lot-history__frame">
              <CardImage card={card} typeCard={typeCard} getCardImageUrl={getCardImageUrl} alt={`Carta ${card}`} loading="lazy" />
            </div>
            <span className="lot-history__badge">{index + 1}</span>
          </div>
        ))}
      </div>
    </div>

    <footer className="lot-end__foot">
      <button type="button" className="lot-btn lot-btn--start lot-btn--block" onClick={onRestart}>
        <FaRedo />
        <span className="lot-btn__label">Jugar otra vez</span>
      </button>
    </footer>
  </section>
);

GameOverScreen.propTypes = {
  cards: PropTypes.arrayOf(PropTypes.number).isRequired,
  typeCard: PropTypes.string.isRequired,
  getCardImageUrl: PropTypes.func.isRequired,
  onRestart: PropTypes.func.isRequired,
};

export default GameOverScreen;
