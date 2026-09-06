import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { FaArrowLeft, FaQuestionCircle, FaSignOutAlt, FaTrophy, FaTimes, FaEllipsisV, FaEraser, FaDice } from "react-icons/fa";
import BoardGrid from "./BoardGrid";
import { buildPlayerBoards } from "../../multiplayer/boards";
import { createPlayerCode, decodeGameCode, formatCode, GAME_CODE_LENGTH, onlyDigits } from "../../multiplayer/codes";
import { getMode } from "../../multiplayer/modes";
import { MARKER_KINDS, markerPreview } from "../../multiplayer/markers";
import { clearPlayerSession, loadPlayerSession, savePlayerSession } from "../../multiplayer/session";

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

const PlayerScreen = ({ route, onExit, onOpenHelp }) => {
  const [session, setSession] = useState(() => loadPlayerSession());
  const [marks, setMarks] = useState(() => marksToSets(loadPlayerSession()?.marks));
  const [activeBoard, setActiveBoard] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [confirmNewBoards, setConfirmNewBoards] = useState(false);

  const [codeInput, setCodeInput] = useState(route.gameCode ?? "");
  const [error, setError] = useState("");

  const commit = useCallback((next) => {
    savePlayerSession(next);
    setSession(next);
    setMarks(marksToSets(next.marks));
  }, []);

  /**
   * Entrar a una sala. El código trae dentro cuántos cartones y qué modo, así
   * que el jugador no elige nada: por eso no puede desajustarse con el
   * anfitrión.
   */
  const join = useCallback(
    (code) => {
      const room = decodeGameCode(code);
      if (!room) return;

      const saved = loadPlayerSession();
      // Volver a la misma sala conserva código y marcas; entrar en otra
      // empieza de cero, porque el cartón ya no sería el mismo.
      const sameRoom = saved?.gameCode === room.gameCode;

      commit({
        ...room,
        playerCode: sameRoom ? saved.playerCode : createPlayerCode(),
        // Sala nueva, elección nueva: la pantalla de marcador sale sola.
        marker: sameRoom ? saved.marker : null,
        marks: sameRoom ? saved.marks : {},
      });
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

  const handleSubmit = (event) => {
    event.preventDefault();
    const digits = onlyDigits(codeInput, GAME_CODE_LENGTH);

    if (digits.length !== GAME_CODE_LENGTH) {
      setError(`El código tiene ${GAME_CODE_LENGTH} dígitos.`);
      return;
    }
    if (!decodeGameCode(digits)) {
      setError("Ese código no existe. Revisa los números, hay alguno cambiado.");
      return;
    }

    setError("");
    join(digits);
  };

  /** Quita las marcas y deja el mismo cartón: el anfitrión rebarajó el mazo. */
  const clearMarks = () => {
    commit({ ...session, marks: {} });
    setActiveBoard(0);
    setShowOptions(false);
  };

  /** Estrena código de jugador, y con él cartones nuevos. */
  const requestNewBoards = () => {
    commit({ ...session, playerCode: createPlayerCode(), marks: {} });
    setActiveBoard(0);
    setConfirmNewBoards(false);
    setShowOptions(false);
  };

  const changeMarker = (marker) => commit({ ...session, marker, marks: setsToMarks(marks) });

  const leave = () => {
    clearPlayerSession();
    setSession(null);
    setMarks({});
    setCodeInput("");
    setShowOptions(false);
    setShowWin(false);
  };

  const closeOptions = () => {
    setShowOptions(false);
    setConfirmNewBoards(false);
  };

  // ------------------------------------------------------------
  if (!session) {
    return (
      <div className="mp-screen">
        <header className="mp-screen__head">
          <button type="button" className="lot-btn lot-btn--ghost mp-back" onClick={onExit}>
            <FaArrowLeft />
            <span>Volver</span>
          </button>
          <h1 className="mp-screen__title">Entrar a la partida</h1>
        </header>

        <div className="mp-screen__body">
          <form className="mp-join" onSubmit={handleSubmit}>
            <label className="mp-field">
              <span className="mp-field__label">Código de partida</span>
              <input
                className="mp-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={GAME_CODE_LENGTH}
                placeholder="000000"
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(onlyDigits(e.target.value, GAME_CODE_LENGTH));
                  setError("");
                }}
                aria-describedby="mp-join-error"
                autoFocus
              />
            </label>

            <p id="mp-join-error" className={`lot-note ${error ? "lot-note--warn" : ""}`} role={error ? "alert" : undefined}>
              {error || "Los 6 dígitos que canta el anfitrión."}
            </p>

            <button type="submit" className="lot-btn lot-btn--start lot-btn--block">
              Recibir mis cartones
            </button>

            <p className="lot-note">
              No hay nada más que configurar: el código ya trae cuántos cartones te tocan y en qué modo se juega. Lo decide el anfitrión.
            </p>

            <button type="button" className="lot-btn lot-btn--ghost lot-btn--block" onClick={onOpenHelp}>
              <FaQuestionCircle /> Cómo funciona
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Ya tiene cartones pero todavía no ha dicho con qué marca. Un cartón usa un
  // solo tipo, así que la elección va antes de empezar y no a media partida.
  if (!session.marker) {
    return (
      <div className="mp-screen">
        <header className="mp-screen__head">
          <h1 className="mp-screen__title">¿Con qué vas a marcar?</h1>
        </header>

        <div className="mp-screen__body">
          <p className="mp-picker__intro">
            Ya tienes {session.boardsPerPlayer > 1 ? `tus ${session.boardsPerPlayer} cartones` : "tu cartón"}. Escoge con qué los vas a ir tapando: todo el
            cartón usará lo mismo.
          </p>

          <div className="mp-picker">
            {MARKER_KINDS.map((kind) => (
              <button key={kind.id} type="button" className="mp-picker__option" onClick={() => changeMarker(kind.id)}>
                <span className="mp-picker__samples" aria-hidden="true">
                  {markerPreview(kind.id).map((piece, i) => (
                    <img
                      key={i}
                      src={piece.src}
                      alt=""
                      style={{ "--mp-rot": `${piece.rotation}deg`, "--mp-scale": piece.scale }}
                    />
                  ))}
                </span>
                <span className="mp-picker__text">
                  <strong>{kind.label}</strong>
                  <span>{kind.hint}</span>
                </span>
              </button>
            ))}
          </div>

          <p className="lot-note">Puedes cambiarlo luego desde el menú de la partida.</p>

          {/* Sin esto, quien llega aquí por error se queda encerrado: la
              cabecera de esta pantalla no lleva botón de volver. */}
          <button type="button" className="lot-btn lot-btn--ghost lot-btn--block mp-picker__leave" onClick={leave}>
            <FaSignOutAlt /> Salir de la partida
          </button>
        </div>
      </div>
    );
  }

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
        <button type="button" className="lot-btn lot-btn--ghost mp-leave" onClick={() => setShowOptions(true)} aria-label="Opciones de la partida">
          <FaEllipsisV />
        </button>
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

      {showWin && (
        <div className="lot-modal-overlay" onClick={() => setShowWin(false)} role="presentation">
          <div className="lot-modal mp-win" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Tu código para verificar">
            <header className="lot-modal__header">
              <div className="lot-modal__heading">
                <h2 className="lot-modal__title">Dile esto al anfitrión</h2>
              </div>
              <button type="button" className="lot-panel__close" onClick={() => setShowWin(false)} aria-label="Cerrar">
                <FaTimes />
              </button>
            </header>

            <div className="lot-modal__body mp-win__body">
              <span className="mp-win__code">{formatCode(session.playerCode)}</span>
              <p className="lot-note">
                Con estos 5 dígitos el anfitrión reconstruye {session.boardsPerPlayer > 1 ? `tus ${session.boardsPerPlayer} cartones` : "tu cartón"} y comprueba
                si cantaste bien.
              </p>
            </div>
          </div>
        </div>
      )}

      {showOptions && (
        <div className="lot-modal-overlay" onClick={closeOptions} role="presentation">
          <div className="lot-modal mp-options" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Opciones de la partida">
            <header className="lot-modal__header">
              <div className="lot-modal__heading">
                <h2 className="lot-modal__title">Mi partida</h2>
              </div>
              <button type="button" className="lot-panel__close" onClick={closeOptions} aria-label="Cerrar">
                <FaTimes />
              </button>
            </header>

            <div className="lot-modal__body">
              <section className="lot-section">
                <div className="lot-section__head">
                  <h3 className="lot-section__title">Con qué marcas</h3>
                </div>
                <div className="lot-segmented lot-segmented--grid" role="group" aria-label="Tipo de marcador">
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
              </section>

              <button type="button" className="mp-role" onClick={clearMarks}>
                <FaEraser />
                <span className="mp-role__text">
                  <strong>Nueva ronda</strong>
                  <span>Quita tus marcas y te quedas con los mismos cartones.</span>
                </span>
              </button>

              {confirmNewBoards ? (
                <div className="mp-confirm">
                  <p>Vas a cambiar de cartones. Los de ahora se pierden.</p>
                  <div className="mp-confirm__actions">
                    <button type="button" className="lot-btn lot-btn--ghost" onClick={() => setConfirmNewBoards(false)}>
                      Mejor no
                    </button>
                    <button type="button" className="lot-btn lot-btn--danger" onClick={requestNewBoards}>
                      Sí, otros cartones
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="mp-role" onClick={() => setConfirmNewBoards(true)}>
                  <FaDice />
                  <span className="mp-role__text">
                    <strong>Pedir otros cartones</strong>
                    <span>Estrenas código de jugador y te tocan cartones nuevos.</span>
                  </span>
                </button>
              )}

              <button type="button" className="lot-btn lot-btn--ghost lot-btn--block" onClick={onOpenHelp}>
                <FaQuestionCircle /> Cómo funciona
              </button>

              <button type="button" className="lot-btn lot-btn--ghost lot-btn--block" onClick={leave}>
                <FaSignOutAlt /> Salir de la partida
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

PlayerScreen.propTypes = {
  route: PropTypes.shape({ gameCode: PropTypes.string }).isRequired,
  onExit: PropTypes.func.isRequired,
  onOpenHelp: PropTypes.func.isRequired,
};

export default PlayerScreen;
