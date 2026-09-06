import PropTypes from "prop-types";
import { FaSlidersH } from "react-icons/fa";

const MenuButton = ({ onClick }) => (
  <button type="button" className="lot-fab" onClick={onClick} aria-label="Abrir ajustes">
    <FaSlidersH />
  </button>
);

export default MenuButton;

MenuButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};
