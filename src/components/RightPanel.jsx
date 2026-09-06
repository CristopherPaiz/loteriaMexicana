import PropTypes from "prop-types";
import { useEffect, useRef } from "react";
import VoiceButton from "./VoiceButton";
import { FaTimes, FaPrint } from "react-icons/fa";

const TIME_MIN = 3;
const TIME_MAX = 10;
const VOLUME_LEVELS = [1.0, 1.5, 2.0];
const CARD_STYLES = [
  { value: "HD", label: "HD" },
  { value: "SD", label: "Clásico" },
];

const RightPanel = ({
  showMenu,
  voices,
  activeVoice,
  handleVoiceChange,
  setShowMenu,
  setTime,
  time,
  typeCard,
  setTypeCard,
  onOpenGenerator,
  volumeBoost = 1.0,
  onVolumeChangeRequest = () => {},
  dimLevel = 0.5,
  setDimLevel = () => {},
}) => {
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return undefined;

    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setShowMenu(false);
    };

    // mousedown para detectar el clic antes de que lo procesen otros elementos
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [setShowMenu, showMenu]);

  return (
    <>
      <div className={`lot-panel-backdrop ${showMenu ? "is-open" : ""}`} aria-hidden="true" />

      <aside
        ref={panelRef}
        className={`lot-panel ${showMenu ? "is-open" : ""}`}
        role="dialog"
        aria-modal="false"
        aria-label="Ajustes del juego"
        aria-hidden={!showMenu}
      >
        <header className="lot-panel__header">
          <div className="lot-panel__heading">
            <h2 className="lot-panel__title">Ajustes</h2>
            <span className="lot-panel__subtitle">Voz, ritmo y presentación</span>
          </div>
          <button ref={closeButtonRef} type="button" className="lot-panel__close" onClick={() => setShowMenu(false)} aria-label="Cerrar ajustes">
            <FaTimes />
          </button>
        </header>

        <div className="lot-panel__body">
          <section className="lot-section">
            <div className="lot-section__head">
              <h3 className="lot-section__title">Voz del gritón</h3>
            </div>

            <div className="lot-voices">
              {voices.map((voice) => (
                <VoiceButton key={voice} voice={voice} activeVoice={activeVoice} onClick={handleVoiceChange} />
              ))}
            </div>

            <p className="lot-note">El cambio de voz aplica en la siguiente carta cantada.</p>
          </section>

          <section className="lot-section">
            <div className="lot-section__head">
              <h3 className="lot-section__title">Tiempo por carta</h3>
              <span className="lot-section__value">{time} s</span>
            </div>

            <input
              className="lot-range"
              type="range"
              min={TIME_MIN}
              max={TIME_MAX}
              step="1"
              value={time}
              onChange={(e) => setTime(parseInt(e.target.value, 10))}
              aria-label="Segundos entre cartas"
            />
            <div className="lot-range-scale">
              <span>{TIME_MIN}s</span>
              <span>{TIME_MAX}s</span>
            </div>
          </section>

          <section className="lot-section">
            <div className="lot-section__head">
              <h3 className="lot-section__title">Estilo de cartas</h3>
            </div>

            <div className="lot-segmented" role="group" aria-label="Estilo de cartas">
              {CARD_STYLES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`lot-segmented__option ${typeCard === value ? "is-active" : ""}`}
                  onClick={() => setTypeCard(value)}
                  aria-pressed={typeCard === value}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="lot-section">
            <div className="lot-section__head">
              <h3 className="lot-section__title">Volumen extra</h3>
              <span className="lot-section__value">{Math.round(volumeBoost * 100)}%</span>
            </div>

            <div className="lot-segmented lot-segmented--warn" role="group" aria-label="Volumen extra">
              {VOLUME_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`lot-segmented__option ${volumeBoost === level ? "is-active" : ""}`}
                  onClick={() => onVolumeChangeRequest(level)}
                  aria-pressed={volumeBoost === level}
                >
                  {level * 100}%
                </button>
              ))}
            </div>

            <p className="lot-note lot-note--warn">Arriba del 100% puede distorsionar el audio y dañar tus altavoces.</p>
          </section>

          <section className="lot-section">
            <div className="lot-section__head">
              <h3 className="lot-section__title">Oscuridad del fondo</h3>
              <span className="lot-section__value">{Math.round(dimLevel * 100)}%</span>
            </div>

            <input
              className="lot-range"
              type="range"
              min="0"
              max="0.9"
              step="0.1"
              value={dimLevel}
              onChange={(e) => setDimLevel(parseFloat(e.target.value))}
              aria-label="Oscuridad del fondo"
            />
            <div className="lot-range-scale">
              <span>Claro</span>
              <span>Oscuro</span>
            </div>
          </section>
        </div>

        <footer className="lot-panel__footer">
          <button type="button" className="lot-btn lot-btn--danger lot-btn--block" onClick={onOpenGenerator}>
            <FaPrint /> Generador de cartones
          </button>
        </footer>
      </aside>
    </>
  );
};

RightPanel.propTypes = {
  showMenu: PropTypes.bool.isRequired,
  voices: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeVoice: PropTypes.string.isRequired,
  handleVoiceChange: PropTypes.func.isRequired,
  setShowMenu: PropTypes.func.isRequired,
  setTime: PropTypes.func.isRequired,
  time: PropTypes.number.isRequired,
  typeCard: PropTypes.string.isRequired,
  setTypeCard: PropTypes.func.isRequired,
  onOpenGenerator: PropTypes.func.isRequired,
  volumeBoost: PropTypes.number,
  onVolumeChangeRequest: PropTypes.func,
  dimLevel: PropTypes.number,
  setDimLevel: PropTypes.func,
};

export default RightPanel;
