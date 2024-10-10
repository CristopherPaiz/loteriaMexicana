import MiniCard from "./MiniCard";
import PropTypes from "prop-types";

const TopPanel = ({ pastCards, typeCard, displayedCard }) => {
  return (
    <div className="top-panel" style={{ position: "relative", height: "100px" }}>
      {pastCards.map((card, index) => (
        <MiniCard key={card} number={card} index={index} totalCards={pastCards.length} typeCard={typeCard} isDisplayed={card === displayedCard} />
      ))}
    </div>
  );
};

TopPanel.propTypes = {
  pastCards: PropTypes.arrayOf(PropTypes.number).isRequired,
  typeCard: PropTypes.string.isRequired,
  displayedCard: PropTypes.number,
};

export default TopPanel;
