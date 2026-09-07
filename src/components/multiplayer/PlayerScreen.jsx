import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { FaQuestionCircle, FaTrophy, FaTimes, FaRedo, FaDice, FaSignOutAlt } from "react-icons/fa";
import BoardGrid from "./BoardGrid";
import ConfirmModal from "./ConfirmModal";
import HowItWorks from "./HowItWorks";
import useModalDismiss from "../../multiplayer/useModalDismiss";
import { buildPlayerBoards } from "../../multiplayer/boards";
import { createPlayerCode, decodeGameCode, formatCode } from "../../multiplayer/codes";
import { getMode } from "../../multiplayer/modes";
import { MARKER_KINDS, markerFor, markerPreview } from "../../multiplayer/markers";
import { clearPlayerSession, joinRoom, loadPlayerSession, savePlayerSession } from "../../multiplayer/session";

/** Las marcas se guardan como array (JSON no serializa Sets). */
const marksToSets = (marks) => {
  const result = {};
  Object.entries(marks ?? {}).forEach(([key, value]) => {
    result[key] = new Set(Array.isArray(value) ? value : []);
  });
  return result;
};

const setsToMarks = (sets) => {
  const result = {};
  Object.entries(sets).forEach(([key, value]) => {
    result[key] = [...value];
  });
  return result;
};

const PlayerScreen = ({ route, onExit }) => {
  const [session, setSession] = useState(() => loadPlayerSession());
  const [marks, setMarks] = useState(() => marksToSets(loadPlayerSession()?.marks));
  const [activeBoard, setActiveBoard] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [confirmNewBoards, setConfirmNewBoards] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [changingMarker, setChangingMarker] = useState(false);

  const commit = useCallback((next) => {
    savePlayerSession(next);
    setSession(next);
    setMarks(marksToSets(next.marks));
  }, []);

  /** Solo se usa al llegar por QR: el código ya viene en la ruta. */
  const join = useCallback(
    (code) => {
      const next = joinRoom(code);
      if (!next) return;
      commit(next);
      setActiveBoard(0);
    },
    [commit]
  );

  // Un QR entra solo: nadie quiere teclear lo que acaba de escanear.
  useEffect(() => {
    if (!route.gameCode || session?.gameCode === route.gameCode) return;
    if (!decodeGameCode(route.gameCode)) return;
    join(route.gameCode);
  }, [route.gameCode, session?.gameCode, join]);

  const boards = useMemo(() => (session ? buildPlayerBoards(session.gameCode, session.playerCode, session.boardsPerPlayer) : []), [session]);

  const mode = getMode(session?.modeId);

  const toggleCell = (index) => {
    setMarks((previous) => {
      const current = new Set(previous[activeBoard] ?? []);
      if (current.has(index)) current.delete(index);
      else current.add(index);

      const next = { ...previous, [activeBoard]: current };
      savePlayerSession({ ...session, marks: setsToMarks(next) });
      return next;
    });
  };

  const closeWin = () => setShowWin(false);

  /** Quita las marcas y deja el mismo cartón: el anfitrión rebarajó el mazo. */
  const clearMarks = () => {
    commit({ ...session, marks: {} });
    setActiveBoard(0);
    closeWin();
  };

  /** Otro código de jugador es, en la práctica, otros cartones. */
  const requestNewBoards = () => {
    commit({ ...session, playerCode: createPlayerCode(), marks: {} });
    setActiveBoard(0);
    setConfirmNewBoards(false);
    closeWin();
  };

  const changeMarker = (marker) => {
    commit({ ...session, marker, marks: setsToMarks(marks) });
    setChangingMarker(false);
  };

  const leave = () => {
    clearPlayerSession();
    setSession(null);
    setMarks({});
    setConfirmLeave(false);
    closeWin();
    onExit();
  };

  useModalDismiss(showWin, closeWin);

  // Sin partida guardada no hay nada que enseñar: se vuelve al inicio, donde
  // el modal de entrada pide el código.
  useEffect(() => {
    if (!session && !route.gameCode) onExit();
  }, [session, route.gameCode, onExit]);

  if (!session) return null;

  // Sin marcador elegido hay que decidir; abierto a mano se puede cerrar.
  const pickingMarker = !session.marker || changingMarker;
  const currentMarker = session.marker ? markerFor(session.marker, "cabecera") : null;

  return (
    <div className="mp-screen">
      <header className="mp-screen__head mp-screen__head--player">
        <div className="mp-identity">
          <span className="mp-identity__label">Tu código</span>
          <strong className="mp-identity__code">{formatCode(session.playerCode)}</strong>
        </div>

        <div className="mp-head-actions">
          {/* Enseña con qué se está marcando y sirve para cambiarlo: el propio
              frijol es el botón, no hace falta explicarlo. */}
          {currentMarker && (
            <button type="button" className="mp-icon-btn mp-icon-btn--marker" onClick={() => setChangingMarker(true)} aria-label="Cambiar con qué marcas">
              <img src={currentMarker.src} alt="" aria-hidden="true" />
            </button>
          )}
          <button type="button" className="mp-icon-btn" onClick={() => setShowHelp(true)} aria-label="Cómo funciona">
            <FaQuestionCircle />
          </button>
        </div>
      </header>

      <p className="mp-mode-banner">
        Partida <strong>{formatCode(session.gameCode)}</strong> · {mode.label} · {mode.short}
      </p>

      {boards.length > 1 && (
        <div className="lot-segmented mp-board-tabs" role="group" aria-label="Elegir cartón">
          {boards.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`lot-segmented__option ${activeBoard === index ? "is-active" : ""}`}
              onClick={() => setActiveBoard(index)}
              aria-pressed={activeBoard === index}
            >
              Cartón {index + 1}
              {marks[index]?.size ? <span className="mp-board-tabs__count">{marks[index].size}</span> : null}
            </button>
          ))}
        </div>
      )}

      <div className="mp-screen__body mp-screen__body--board">
        <BoardGrid board={boards[activeBoard]} marked={marks[activeBoard] ?? new Set()} onToggle={toggleCell} marker={session.marker} />
      </div>

      <footer className="mp-screen__foot">
        {/* Solo el icono: al lado de "¡Lotería!" se entiende, y así no le
            quita ancho al botón que de verdad se usa. */}
        <button type="button" className="lot-btn lot-btn--danger mp-foot__leave" onClick={() => setConfirmLeave(true)} aria-label="Salir de la partida">
          <FaSignOutAlt />
        </button>

        <button type="button" className="lot-btn lot-btn--start mp-foot__win" onClick={() => setShowWin(true)}>
          <FaTrophy /> ¡Lotería!
        </button>
      </footer>

      {/* Momento de cantar: primero el número que hay que decir en voz alta y,
          debajo, lo único que se hace cuando termina la ronda. */}
      {showWin && (
        <div className="lot-modal-overlay" onClick={closeWin} role="presentation">
          <div className="lot-modal mp-win" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Cantaste lotería">
            <button type="button" className="mp-win__close" onClick={closeWin} aria-label="Cerrar">
              <FaTimes />
            </button>

            <div className="lot-modal__body mp-win__body">
              <span className="mp-win__badge" aria-hidden="true">
                <FaTrophy />
              </span>

              <span className="mp-win__label">Tu código</span>
              <span className="mp-win__code">{formatCode(session.playerCode)}</span>
              <p className="mp-win__hint">Dile estos números al anfitrión para que revise tu cartón.</p>

              <span className="mp-win__next">¿Y después?</span>

              <button type="button" className="mp-role" onClick={clearMarks}>
                <FaRedo />
                <span className="mp-role__text">
                  <strong>Repetir con mi cartón</strong>
                  <span>Quito mis marcas y sigo con las mismas cartas.</span>
                </span>
              </button>

              <button type="button" className="mp-role" onClick={() => setConfirmNewBoards(true)}>
                <FaDice />
                <span className="mp-role__text">
                  <strong>Cartón nuevo</strong>
                  <span>Me tocan otras cartas para la siguiente ronda.</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Se elige sobre el cartón ya repartido, no antes: así se ve encima de
          qué van a caer los frijoles. */}
      {pickingMarker && (
        <div className="lot-modal-overlay lot-modal-overlay--top" onClick={changingMarker ? () => setChangingMarker(false) : undefined} role="presentation">
          <div className="lot-modal mp-picker-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Elige con qué vas a marcar">
            <header className="lot-modal__header">
              <div className="lot-modal__heading">
                <h2 className="lot-modal__title">¿Con qué vas a marcar?</h2>
              </div>
              {changingMarker && (
                <button type="button" className="lot-panel__close" onClick={() => setChangingMarker(false)} aria-label="Cerrar">
                  <FaTimes />
                </button>
              )}
            </header>

            <div className="lot-modal__body">
              <div className="mp-picker">
                {MARKER_KINDS.map((kind) => (
                  <button
                    key={kind.id}
                    type="button"
                    className={`mp-picker__option ${session.marker === kind.id ? "is-active" : ""}`}
                    onClick={() => changeMarker(kind.id)}
                  >
                    <span className="mp-picker__samples" aria-hidden="true">
                      {markerPreview(kind.id).map((piece, i) => (
                        <img key={i} src={piece.src} alt="" style={{ "--mp-rot": `${piece.rotation}deg`, "--mp-scale": piece.scale }} />
                      ))}
                    </span>
                    <span className="mp-picker__name">{kind.label}</span>
                  </button>
                ))}
              </div>

              <p className="lot-note">Todo tu cartón usará lo mismo. Puedes cambiarlo cuando quieras.</p>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmNewBoards}
        title="¿Cartón nuevo?"
        confirmText="Sí, dame otro"
        onConfirm={requestNewBoards}
        onCancel={() => setConfirmNewBoards(false)}
      >
        Te tocarán otras cartas. El cartón de ahora se pierde.
      </ConfirmModal>

      <ConfirmModal isOpen={confirmLeave} title="¿Salir de la partida?" confirmText="Sí, salir" onConfirm={leave} onCancel={() => setConfirmLeave(false)}>
        Pierdes tu cartón y tu código. Para volver tendrás que entrar otra vez con el código de la partida.
      </ConfirmModal>

      <HowItWorks isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
};

PlayerScreen.propTypes = {
  route: PropTypes.shape({ gameCode: PropTypes.string }).isRequired,
  onExit: PropTypes.func.isRequired,
};

export default PlayerScreen;
