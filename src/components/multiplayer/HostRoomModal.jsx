import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FaTimes, FaSyncAlt, FaCopy, FaCheck, FaQuestionCircle, FaUsers, FaClipboardCheck, FaCrown, FaMobileAlt, FaPlay, FaArrowLeft, FaTable } from "react-icons/fa";
import QrCode from "./QrCode";
import JoinForm from "./JoinForm";
import VerifyPanel from "./VerifyPanel";
import ConfirmModal from "./ConfirmModal";
import useModalDismiss from "../../multiplayer/useModalDismiss";
import { createGameCode, decodeGameCode, formatCode, MAX_BOARDS } from "../../multiplayer/codes";
import { GAME_MODES, getMode } from "../../multiplayer/modes";
import { buildJoinUrl } from "../../multiplayer/session";

const BOARD_OPTIONS = Array.from({ length: MAX_BOARDS }, (_, i) => i + 1);

/**
 * Modal único del multijugador. Cuatro vistas, nunca mezcladas:
 *
 *   elegir     -> qué papel juega este teléfono
 *   unirse     -> el jugador teclea el código y se va a su cartón
 *   sala       -> ajustes del anfitrión, y solo del anfitrión
 *   verificar  -> comprobar la lotería que acaban de cantar
 *
 * El anfitrión decide todo y el código lo lleva dentro, así que tocar cualquier
 * ajuste genera un código nuevo: otra configuración es otra sala.
 */
const HostRoomModal = ({ isOpen, onClose, room, onRoomChange, onJoinAsPlayer, onStartGame, drawnCards, typeCard, onOpenHelp, hasPlayerBoard = false, initialView = "sala" }) => {
  const [view, setView] = useState(initialView);
  const [copied, setCopied] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const closeRef = useRef(null);
  const copyTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setConfirmClose(false);
    }
  }, [isOpen, initialView]);

  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  useModalDismiss(isOpen, onClose);

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

  const isJoining = !room && view === "unirse";

  return (
    <>
      <div className="lot-modal-overlay" onClick={onClose} role="presentation">
        <div className="lot-modal mp-room" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Multijugador">
          <header className="lot-modal__header">
            {isJoining && (
              <button type="button" className="lot-panel__close" onClick={() => setView("elegir")} aria-label="Volver">
                <FaArrowLeft />
              </button>
            )}
            <div className="lot-modal__heading">
              <h2 className="lot-modal__title">{isJoining ? "Entrar a la partida" : "Multijugador"}</h2>
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
            {isJoining && <JoinForm onJoined={onJoinAsPlayer} onOpenHelp={onOpenHelp} />}

            {!room && !isJoining && (
              <div className="mp-empty">
                <p className="mp-empty__intro">Cada quien juega con su cartón en su teléfono. Alguien canta y los demás van tapando.</p>

                {hasPlayerBoard && (
                  <button type="button" className="mp-role mp-role--back" onClick={onJoinAsPlayer}>
                    <FaTable />
                    <span className="mp-role__text">
                      <strong>Volver a mi cartón</strong>
                      <span>Ya tienes uno en esta partida.</span>
                    </span>
                  </button>
                )}

                <button type="button" className="mp-role mp-role--host" onClick={() => reconfigure({})}>
                  <FaCrown />
                  <span className="mp-role__text">
                    <strong>Yo canto las cartas</strong>
                    <span>Creas la sala y repartes el código.</span>
                  </span>
                </button>

                <button type="button" className="mp-role" onClick={() => setView("unirse")}>
                  <FaMobileAlt />
                  <span className="mp-role__text">
                    <strong>Voy a jugar</strong>
                    <span>Escribe el código y recibe tus cartones.</span>
                  </span>
                </button>

                <button type="button" className="lot-btn lot-btn--ghost lot-btn--block" onClick={onOpenHelp}>
                  <FaQuestionCircle /> Cómo funciona
                </button>
              </div>
            )}

            {room && view === "sala" && (
              <div className="mp-room__layout">
                <section className="mp-room__code">
                  <span className="mp-field__label">Código de partida</span>
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
                </section>

                {/* Plegado por defecto: lo que se usa siempre es el código,
                    no la configuración. */}
                <details className="mp-more">
                  <summary className="mp-more__summary">Más ajustes</summary>

                  <div className="mp-more__body">
                    <section className="mp-room__field">
                      <span className="mp-field__label">Cartones por jugador</span>
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
                    </section>

                    <section className="mp-room__field">
                      <span className="mp-field__label">Modo de juego</span>
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
                      <p className="mp-room__hint">{mode.description}</p>
                    </section>

                    <p className="mp-room__hint mp-room__hint--warn">Cambiar un ajuste estrena código.</p>
                  </div>
                </details>

                <div className="mp-room__foot">
                  <button type="button" className="lot-btn lot-btn--ghost lot-btn--block" onClick={onOpenHelp}>
                    <FaQuestionCircle /> Cómo funciona
                  </button>

                  <div className="mp-room__foot-row">
                    <button type="button" className="lot-btn lot-btn--danger" onClick={() => setConfirmClose(true)}>
                      Cerrar sala
                    </button>
                    <button type="button" className="lot-btn lot-btn--start" onClick={onStartGame}>
                      <FaPlay /> Comenzar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {room && view === "verificar" && <VerifyPanel room={room} drawnCards={drawnCards} typeCard={typeCard} mode={mode} />}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmClose}
        title="¿Cerrar la sala?"
        confirmText="Sí, cerrar"
        onConfirm={() => onRoomChange(null)}
        onCancel={() => setConfirmClose(false)}
      >
        Este teléfono vuelve al juego normal. Los jugadores conservan sus cartones, pero se quedan sin quien verifique.
      </ConfirmModal>
    </>
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
  hasPlayerBoard: PropTypes.bool,
  initialView: PropTypes.oneOf(["sala", "verificar", "elegir", "unirse"]),
};

export default HostRoomModal;
