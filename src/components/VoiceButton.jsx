import PropTypes from "prop-types";

const VOICE_META = {
  hombre: { label: "Hombre", icon: "🧔" },
  mujer: { label: "Mujer", icon: "👩" },
  nino: { label: "Niño", icon: "🧒" },
  joven: { label: "Joven", icon: "🧑" },
};

const VoiceButton = ({ voice, activeVoice, onClick }) => {
  const meta = VOICE_META[voice] || { label: voice, icon: "🎙️" };
  const isActive = activeVoice === voice;

  return (
    <button type="button" className={`lot-voice ${isActive ? "is-active" : ""}`} onClick={() => onClick(voice)} aria-pressed={isActive}>
      <span className="lot-voice__icon" aria-hidden="true">
        {meta.icon}
      </span>
      {meta.label}
    </button>
  );
};

VoiceButton.propTypes = {
  voice: PropTypes.string.isRequired,
  activeVoice: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default VoiceButton;
