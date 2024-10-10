import PropTypes from "prop-types";

const MenuButton = ({ onClick }) => (
  <button className="menu-button" onClick={onClick}>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M4 8l16 0" />
      <path d="M4 16l16 0" />
    </svg>
  </button>
);

export default MenuButton;

MenuButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};
