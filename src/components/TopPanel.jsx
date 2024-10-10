import MiniCard from "./MiniCard";
import PropTypes from "prop-types";

const TopPanel = ({ pastCards, typeCard }) => (
  <div className="top-panel" style={{ position: "relative", height: "100px" }}>
    {pastCards.map((card, index) => (
      <MiniCard key={index} number={card} index={index} totalCards={pastCards.length} typeCard={typeCard} />
    ))}
  </div>
);

TopPanel.propTypes = {
  pastCards: PropTypes.arrayOf(PropTypes.number).isRequired,
  typeCard: PropTypes.string.isRequired,
};

export default TopPanel;
