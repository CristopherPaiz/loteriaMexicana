import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { FaArrowLeft, FaQuestionCircle, FaSignOutAlt, FaTrophy, FaTimes } from "react-icons/fa";
import BoardGrid from "./BoardGrid";
import { buildPlayerBoards, MAX_BOARDS_PER_PLAYER } from "../../multiplayer/boards";
import { createPlayerCode, formatCode, GAME_CODE_LENGTH, isValidGameCode, onlyDigits } from "../../multiplayer/codes";
import { DEFAULT_MODE_ID, GAME_MODES, getMode } from "../../multiplayer/modes";
import { clearPlayerSession, loadPlayerSession, savePlayerSession } from "../../multiplayer/session";

const BOARD_OPTIONS = Array.from({ length: MAX_BOARDS_PER_PLAYER }, (_, i) => i + 1);

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

  // Campos del formulario de entrada, prellenados por el QR cuando llega por ahí.
  const [codeInput, setCodeInput] = useState(route.gameCode ?? "");
  const [boardsInput, setBoardsInput] = useState(route.boardsPerPlayer ?? 1);
  const [modeInput, setModeInput] = useState(route.modeId ?? DEFAULT_MODE_ID);
  const [error, setError] = useState("");

  const fromQr = Boolean(route.gameCode && route.boardsPerPlayer && route.modeId);

  const join = useCallback((gameCode, boardsPerPlayer, modeId) => {
    const saved = loadPlayerSession();
    // Volver a la misma partida conserva código y frijoles; entrar en otra
    // empieza de cero, porque el cartón ya no sería el mismo.
    const sameGame = saved?.gameCode === gameCode;

    const next = {
      gameCode,
      playerCode: sameGame ? saved.playerCode : createPlayerCode(),
      boardsPerPlayer,
      modeId,
      marks: sameGame ? saved.marks : {},
    };

    savePlayerSession(next);
    setSession(next);
    setMarks(marksToSets(next.marks));
    setActiveBoard(0);
  }, []);

  // Un QR que trae todo resuelto entra solo: nadie quiere teclear lo que
  // acaba de escanear.
  useEffect(() => {
    if (!fromQr) return;
    if (!isValidGameCode(route.gameCode)) return;
    if (session?.gameCode === route.gameCode) return;

    join(route.gameCode, route.boardsPerPlayer, route.modeId);
  }, [fromQr, route.gameCode, route.boardsPerPlayer, route.modeId, session?.gameCode, join]);

  const boards = useMemo(
    () => (session ? buildPlayerBoards(session.gameCode, session.playerCode, session.boardsPerPlayer) : []),
    [session]
  );

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
    if (!isValidGameCode(digits)) {
      setError("Ese código no existe. Revisa los números, hay alguno cambiado.");
      return;
    }

    setError("");
    join(digits, boardsInput, modeInput);
  };

  const leave = () => {
    clearPlayerSession();
    setSession(null);
    setMarks({});
    setCodeInput("");
    setShowWin(false);
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

            <div className="mp-field">
              <span className="mp-field__label">¿Cuántos cartones dijo?</span>
              <div className="lot-segmented" role="group" aria-label="Cartones por jugador">
                {BOARD_OPTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`lot-segmented__option ${boardsInput === value ? "is-active" : ""}`}
                    onClick={() => setBoardsInput(value)}
                    aria-pressed={boardsInput === value}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="mp-field">
              <span className="mp-field__label">Modo de juego</span>
              <div className="lot-segmented lot-segmented--grid" role="group" aria-label="Modo de juego">
                {GAME_MODES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`lot-segmented__option ${modeInput === item.id ? "is-active" : ""}`}
                    onClick={() => setModeInput(item.id)}
                    aria-pressed={modeInput === item.id}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="lot-note">Si escaneas el QR del anfitrión, esto se rellena solo.</p>

            <button type="submit" className="lot-btn lot-btn--start lot-btn--block">
              Recibir mis cartones
            </button>

            <button type="button" className="lot-btn lot-btn--ghost lot-btn--block" onClick={onOpenHelp}>
              <FaQuestionCircle /> Cómo funciona
            </button>
          </form>
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
        <button type="button" className="lot-btn lot-btn--ghost mp-leave" onClick={leave} aria-label="Salir de la partida">
          <FaSignOutAlt />
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
        <BoardGrid board={boards[activeBoard]} marked={marks[activeBoard] ?? new Set()} onToggle={toggleCell} />
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
    </div>
  );
};

PlayerScreen.propTypes = {
  route: PropTypes.shape({
    gameCode: PropTypes.string,
    boardsPerPlayer: PropTypes.number,
    modeId: PropTypes.string,
  }).isRequired,
  onExit: PropTypes.func.isRequired,
  onOpenHelp: PropTypes.func.isRequired,
};

export default PlayerScreen;
