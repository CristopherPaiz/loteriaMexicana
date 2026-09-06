import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FaTimes, FaSyncAlt, FaCopy, FaCheck, FaQuestionCircle, FaUsers, FaClipboardCheck, FaCrown, FaMobileAlt, FaSignInAlt, FaPlay } from "react-icons/fa";
import QrCode from "./QrCode";
import VerifyPanel from "./VerifyPanel";
import { createGameCode, decodeGameCode, formatCode, MAX_BOARDS } from "../../multiplayer/codes";
import { GAME_MODES, getMode } from "../../multiplayer/modes";
import { buildJoinUrl } from "../../multiplayer/session";

const BOARD_OPTIONS = Array.from({ length: MAX_BOARDS }, (_, i) => i + 1);

/**
 * Sala del anfitrión: crea la partida, decide las reglas y verifica loterías.
 *
 * El anfitrión decide todo y el código lo lleva dentro, así que tocar cualquier
 * ajuste genera un código nuevo: otra configuración es otra sala. Es lo que
 * evita que alguien se quede jugando con reglas viejas sin enterarse.
 */
const HostRoomModal = ({ isOpen, onClose, room, onRoomChange, onJoinAsPlayer, onStartGame, drawnCards, typeCard, onOpenHelp, initialView = "sala" }) => {
  const [view, setView] = useState(initialView);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef(null);
  const copyTimerRef = useRef(null);

  // Cada apertura arranca en la sección que pidió quien abrió: el botón de la
  // cabecera lleva directo a verificar, el del inicio a la sala.
  useEffect(() => {
    if (isOpen) setView(initialView);
  }, [isOpen, initialView]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    closeRef.current?.focus();

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  const joinUrl = useMemo(() => (room ? buildJoinUrl(room.gameCode) : ""), [room]);
  const mode = getMode(room?.modeId);

  if (!isOpen) return null;

  /** Toda configuración estrena código: la sala anterior deja de existir. */
  const reconfigure = (patch) => {
    const next = { boardsPerPlayer: room?.boardsPerPlayer ?? 1, modeId: room?.modeId ?? mode.id, ...patch };
    onRoomChange(decodeGameCode(createGameCode(next)));
    setView("sala");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("No se pudo copiar el enlace:", error);
    }
  };

  return (
    <div className="lot-modal-overlay" onClick={onClose} role="presentation">
      <div className="lot-modal mp-room" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Sala multijugador">
        <header className="lot-modal__header">
          <div className="lot-modal__heading">
            <h2 className="lot-modal__title">Multijugador</h2>
          </div>
          <button ref={closeRef} type="button" className="lot-panel__close" onClick={onClose} aria-label="Cerrar">
            <FaTimes />
          </button>
        </header>

        {room && (
          <div className="lot-segmented mp-room__tabs" role="group" aria-label="Secciones de la sala">
            <button
              type="button"
              className={`lot-segmented__option ${view === "sala" ? "is-active" : ""}`}
              onClick={() => setView("sala")}
              aria-pressed={view === "sala"}
            >
              <FaUsers /> La sala
            </button>
            <button
              type="button"
              className={`lot-segmented__option ${view === "verificar" ? "is-active" : ""}`}
              onClick={() => setView("verificar")}
              aria-pressed={view === "verificar"}
            >
              <FaClipboardCheck /> Verificar
            </button>
          </div>
        )}

        <div className="lot-modal__body">
          {!room && (
            <div className="mp-empty">
              <p className="mp-empty__intro">
                Cada quien juega con su propio cartón en su teléfono y pone sus marcas a mano. Alguien canta las cartas y los demás siguen desde su pantalla.
              </p>

              {/* Dos caminos, no uno: el que canta y el que juega. Cada
                  teléfono elige aquí qué papel le toca. */}
              <button type="button" className="mp-role mp-role--host" onClick={() => reconfigure({})}>
                <FaCrown />
                <span className="mp-role__text">
                  <strong>Yo canto las cartas</strong>
                  <span>Creas la sala y sale un código para repartir. Este teléfono es el gritón.</span>
                </span>
              </button>

              <button type="button" className="mp-role" onClick={onJoinAsPlayer}>
                <FaMobileAlt />
                <span className="mp-role__text">
                  <strong>Voy a jugar</strong>
                  <span>Escribe el código que canta el anfitrión y recibes tus cartones.</span>
                </span>
              </button>

              <button type="button" className="lot-btn lot-btn--ghost lot-btn--block" onClick={onOpenHelp}>
                <FaQuestionCircle /> Cómo funciona
              </button>
            </div>
          )}

          {room && view === "sala" && (
            <>
              <section className="lot-section mp-room__code">
                <span className="lot-section__title">Código de partida</span>
                <strong className="mp-room__digits">{formatCode(room.gameCode)}</strong>
                <QrCode value={joinUrl} />
                <div className="mp-room__actions">
                  <button type="button" className="lot-btn lot-btn--ghost" onClick={copyLink}>
                    {copied ? <FaCheck /> : <FaCopy />} {copied ? "Copiado" : "Copiar"}
                  </button>
                  <button type="button" className="lot-btn lot-btn--ghost" onClick={() => reconfigure({})}>
                    <FaSyncAlt /> Otro código
                  </button>
                </div>
                <p className="lot-note">Estos seis dígitos ya llevan dentro los cartones y el modo. El jugador no configura nada: solo los teclea.</p>
              </section>

              <section className="lot-section">
                <div className="lot-section__head">
                  <h3 className="lot-section__title">Cartones por jugador</h3>
                  <span className="lot-section__value">{room.boardsPerPlayer}</span>
                </div>
                <div className="lot-segmented" role="group" aria-label="Cartones por jugador">
                  {BOARD_OPTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`lot-segmented__option ${room.boardsPerPlayer === value ? "is-active" : ""}`}
                      onClick={() => reconfigure({ boardsPerPlayer: value })}
                      aria-pressed={room.boardsPerPlayer === value}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <p className="lot-note">Gana quien complete el patrón en cualquiera de ellos, no en todos.</p>
              </section>

              <section className="lot-section">
                <div className="lot-section__head">
                  <h3 className="lot-section__title">Modo de juego</h3>
                </div>
                <div className="lot-segmented lot-segmented--grid" role="group" aria-label="Modo de juego">
                  {GAME_MODES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`lot-segmented__option ${room.modeId === item.id ? "is-active" : ""}`}
                      onClick={() => reconfigure({ modeId: item.id })}
                      aria-pressed={room.modeId === item.id}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="lot-note">{mode.description}</p>
              </section>

              <p className="lot-note lot-note--warn">
                Cambiar cualquier ajuste estrena código: otra configuración es otra sala. Reparte el número cuando ya lo tengas todo como quieres.
              </p>

              <button type="button" className="lot-btn lot-btn--start lot-btn--block" onClick={onStartGame}>
                <FaPlay /> Listo, a jugar
              </button>

              <button type="button" className="lot-btn lot-btn--ghost lot-btn--block" onClick={onJoinAsPlayer}>
                <FaSignInAlt /> Entrar como jugador
              </button>

              <button type="button" className="lot-btn lot-btn--ghost lot-btn--block" onClick={onOpenHelp}>
                <FaQuestionCircle /> Cómo funciona
              </button>
            </>
          )}

          {room && view === "verificar" && <VerifyPanel room={room} drawnCards={drawnCards} typeCard={typeCard} mode={mode} />}
        </div>
      </div>
    </div>
  );
};

HostRoomModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  room: PropTypes.shape({
    gameCode: PropTypes.string.isRequired,
    boardsPerPlayer: PropTypes.number.isRequired,
    modeId: PropTypes.string.isRequired,
  }),
  onRoomChange: PropTypes.func.isRequired,
  onJoinAsPlayer: PropTypes.func.isRequired,
  onStartGame: PropTypes.func.isRequired,
  drawnCards: PropTypes.arrayOf(PropTypes.number).isRequired,
  typeCard: PropTypes.string.isRequired,
  onOpenHelp: PropTypes.func.isRequired,
  initialView: PropTypes.oneOf(["sala", "verificar"]),
};

export default HostRoomModal;
