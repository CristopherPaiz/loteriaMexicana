import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { FaQuestionCircle, FaSignOutAlt, FaTrophy, FaTimes, FaEraser, FaDice } from "react-icons/fa";
import BoardGrid from "./BoardGrid";
import ConfirmModal from "./ConfirmModal";
import HowItWorks from "./HowItWorks";
import useBackToClose from "../../multiplayer/useBackToClose";
import { buildPlayerBoards } from "../../multiplayer/boards";
import { createPlayerCode, decodeGameCode, formatCode } from "../../multiplayer/codes";
import { getMode } from "../../multiplayer/modes";
import { MARKER_KINDS, markerPreview } from "../../multiplayer/markers";
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
  const [showHelp, setShowHelp] = useState(false);

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

  const closeWin = () => {
    setShowWin(false);
    setConfirmNewBoards(false);
  };

  /** Quita las marcas y deja el mismo cartón: el anfitrión rebarajó el mazo. */
  const clearMarks = () => {
    commit({ ...session, marks: {} });
    setActiveBoard(0);
    closeWin();
  };

  /** Estrena código de jugador, y con él cartones nuevos. */
  const requestNewBoards = () => {
    commit({ ...session, playerCode: createPlayerCode(), marks: {} });
    setActiveBoard(0);
    closeWin();
  };

  const changeMarker = (marker) => commit({ ...session, marker, marks: setsToMarks(marks) });

  const leave = () => {
    clearPlayerSession();
    setSession(null);
    setMarks({});
    closeWin();
    onExit();
  };

  // Sin partida guardada no hay nada que enseñar: se vuelve al inicio, donde
  // el modal de entrada pide el código.
  useEffect(() => {
    if (!session && !route.gameCode) onExit();
  }, [session, route.gameCode, onExit]);

  useBackToClose(showWin, closeWin);

  if (!session) return null;

  // ------------------------------------------------------------
  return (
    <div className="mp-screen">
      <header className="mp-screen__head mp-screen__head--player">
        <div className="mp-identity">
          <span className="mp-identity__label">Tu código</span>
          <strong className="mp-identity__code">{formatCode(session.playerCode)}</strong>
        </div>
        <div className="mp-identity mp-identity--muted">
          <span className="mp-identity__label">Partida</span>
          <strong className="mp-identity__code">{formatCode(session.gameCode)}</strong>
        </div>
      </header>

      <p className="mp-mode-banner">
        <strong>{mode.label}</strong> · {mode.short}
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
        <button type="button" className="lot-btn lot-btn--start lot-btn--block" onClick={() => setShowWin(true)}>
          <FaTrophy /> ¡Lotería!
        </button>
      </footer>

      {/* Todo lo de "fin de ronda" vive aquí: el código que hay que cantar y,
          justo debajo, lo que se hace después. Es el único momento en que el
          jugador levanta la vista del cartón, así que no hace falta otro menú. */}
      {showWin && (
        <div className="lot-modal-overlay" onClick={closeWin} role="presentation">
          <div className="lot-modal mp-win" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Tu código para verificar">
            <header className="lot-modal__header">
              <div className="lot-modal__heading">
                <h2 className="lot-modal__title">Dile esto al anfitrión</h2>
              </div>
              <button type="button" className="lot-panel__close" onClick={closeWin} aria-label="Cerrar">
                <FaTimes />
              </button>
            </header>

            <div className="lot-modal__body mp-win__body">
              <span className="mp-win__code">{formatCode(session.playerCode)}</span>
              <p className="lot-note">
                Con estos 5 dígitos el anfitrión reconstruye {session.boardsPerPlayer > 1 ? `tus ${session.boardsPerPlayer} cartones` : "tu cartón"} y comprueba
                si cantaste bien.
              </p>

              <hr className="mp-win__rule" />

              <button type="button" className="mp-role" onClick={clearMarks}>
                <FaEraser />
                <span className="mp-role__text">
                  <strong>Nueva ronda</strong>
                  <span>Quita tus marcas y te quedas con los mismos cartones.</span>
                </span>
              </button>

              <button type="button" className="mp-role" onClick={() => setConfirmNewBoards(true)}>
                <FaDice />
                <span className="mp-role__text">
                  <strong>Pedir otros cartones</strong>
                  <span>Estrenas código de jugador y te tocan cartones nuevos.</span>
                </span>
              </button>

              <div className="mp-win__markers">
                <span className="mp-field__label">Con qué marcas</span>
                <div className="lot-segmented" role="group" aria-label="Tipo de marcador">
                  {MARKER_KINDS.map((kind) => (
                    <button
                      key={kind.id}
                      type="button"
                      className={`lot-segmented__option ${session.marker === kind.id ? "is-active" : ""}`}
                      onClick={() => changeMarker(kind.id)}
                      aria-pressed={session.marker === kind.id}
                    >
                      {kind.label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" className="lot-btn lot-btn--ghost lot-btn--block" onClick={() => setShowHelp(true)}>
                <FaQuestionCircle /> Cómo funciona
              </button>

              <button type="button" className="lot-btn lot-btn--danger lot-btn--block" onClick={leave}>
                <FaSignOutAlt /> Salir de la partida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Se elige sobre el cartón ya repartido, no antes: así se ve encima de
          qué van a caer los frijoles. */}
      {!session.marker && (
        <div className="lot-modal-overlay" role="presentation">
          <div className="lot-modal mp-picker-modal" role="dialog" aria-modal="true" aria-label="Elige con qué vas a marcar">
            <header className="lot-modal__header">
              <div className="lot-modal__heading">
                <h2 className="lot-modal__title">¿Con qué vas a marcar?</h2>
              </div>
            </header>

            <div className="lot-modal__body">
              <div className="mp-picker">
                {MARKER_KINDS.map((kind) => (
                  <button key={kind.id} type="button" className="mp-picker__option" onClick={() => changeMarker(kind.id)}>
                    <span className="mp-picker__samples" aria-hidden="true">
                      {markerPreview(kind.id).map((piece, i) => (
                        <img key={i} src={piece.src} alt="" style={{ "--mp-rot": `${piece.rotation}deg`, "--mp-scale": piece.scale }} />
                      ))}
                    </span>
                    <span className="mp-picker__name">{kind.label}</span>
                  </button>
                ))}
              </div>

              <p className="lot-note">Todo tu cartón usará lo mismo. Puedes cambiarlo durante la partida.</p>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmNewBoards}
        title="¿Pedir otros cartones?"
        confirmText="Sí, otros cartones"
        onConfirm={requestNewBoards}
        onCancel={() => setConfirmNewBoards(false)}
      >
        Estrenas código de jugador. Los cartones de ahora se pierden.
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
