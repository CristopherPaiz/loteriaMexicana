import PropTypes from "prop-types";

const VoiceButton = ({ voice, activeVoice, onClick }) => (
  <button className={`voice-button ${activeVoice === voice ? "active" : ""}`} onClick={() => onClick(voice)}>
    {voice === "hombre" ? "Hombre" : voice === "mujer" ? "Mujer" : voice === "nino" ? "Niño" : "Joven"}
  </button>
);

export default VoiceButton;

VoiceButton.propTypes = {
  voice: PropTypes.string.isRequired,
  activeVoice: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};
