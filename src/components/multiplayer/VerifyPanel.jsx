import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { FaCheckCircle, FaTimesCircle, FaSearch } from "react-icons/fa";
import BoardGrid from "./BoardGrid";
import { buildPlayerBoards } from "../../multiplayer/boards";
import { formatCode, isValidPlayerCode, onlyDigits, PLAYER_CODE_LENGTH } from "../../multiplayer/codes";
import { checkBoard, markedIndexes, maskToIndexes } from "../../multiplayer/modes";

/**
 * Verificación de una lotería cantada.
 *
 * El anfitrión escribe los 5 dígitos del jugador y se reconstruyen TODOS sus
 * cartones a la vez: él configuró cuántos hay, así que el jugador no necesita
 * decir en cuál cantó. Un solo dato que dictar.
 *
 * Se juzga contra las cartas realmente cantadas, no contra los frijoles del
 * jugador: los frijoles son cosa suya y olvidarse es parte del juego.
 */
const VerifyPanel = ({ room, drawnCards, typeCard, mode }) => {
  const [codeInput, setCodeInput] = useState("");
  const [query, setQuery] = useState(null);

  const drawn = useMemo(() => new Set(drawnCards), [drawnCards]);

  const results = useMemo(() => {
    if (!query) return null;

    const boards = buildPlayerBoards(room.gameCode, query, room.boardsPerPlayer);

    return boards.map((board, index) => ({
      index,
      board,
      marked: new Set(markedIndexes(board, drawn)),
      outcome: checkBoard(board, drawn, mode),
    }));
  }, [query, room.gameCode, room.boardsPerPlayer, drawn, mode]);

  const winner = results?.find((result) => result.outcome.won) ?? null;

  // Cuando no gana, se informa del cartón que más cerca estuvo: es lo que el
  // anfitrión necesita para explicarle al jugador por qué no vale.
  const closest = results?.reduce((best, result) => (!best || result.outcome.missingIndexes.length < best.outcome.missingIndexes.length ? result : best), null);
  const pending = closest?.outcome.missingIndexes.length ?? 0;

  const submit = (event) => {
    event.preventDefault();
    if (isValidPlayerCode(codeInput)) setQuery(onlyDigits(codeInput, PLAYER_CODE_LENGTH));
  };

  return (
    <div className="mp-verify">
      <form className="mp-verify__form" onSubmit={submit}>
        <label className="mp-field">
          <span className="mp-field__label">Código del jugador</span>
          <input
            className="mp-otp mp-otp--sm"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={PLAYER_CODE_LENGTH}
            placeholder="00000"
            value={codeInput}
            onChange={(e) => {
              setCodeInput(onlyDigits(e.target.value, PLAYER_CODE_LENGTH));
              setQuery(null);
            }}
            autoFocus
          />
        </label>

        <button type="submit" className="lot-btn lot-btn--next lot-btn--block" disabled={!isValidPlayerCode(codeInput)}>
          <FaSearch /> Comprobar
        </button>
      </form>

      {drawnCards.length === 0 && <p className="lot-note lot-note--warn">Todavía no se ha cantado ninguna carta.</p>}

      {results && (
        <div className="mp-verify__results">
          <div className={`mp-verdict ${winner ? "is-win" : "is-fail"}`} role="status">
            {winner ? <FaCheckCircle /> : <FaTimesCircle />}
            <div>
              <strong>{winner ? "¡Lotería buena!" : "Todavía no"}</strong>
              <span>
                {winner
                  ? `Jugador ${formatCode(query)} · cartón ${winner.index + 1} · ${winner.outcome.pattern}`
                  : `Jugador ${formatCode(query)} · ${
                      pending === 1 ? "le falta 1 carta" : `le faltan ${pending} cartas`
                    } en el cartón ${(closest?.index ?? 0) + 1} para ${mode.label}`}
              </span>
            </div>
          </div>

          {results.map((result) => (
            <div key={result.index} className="mp-verify__board">
              <div className="mp-verify__board-head">
                <h4>Cartón {result.index + 1}</h4>
                <span className={result.outcome.won ? "mp-tag mp-tag--win" : "mp-tag"}>
                  {result.outcome.won ? result.outcome.pattern : `${result.marked.size}/16 cantadas`}
                </span>
              </div>

              <BoardGrid
                board={result.board}
                marked={result.marked}
                typeCard={typeCard}
                size="compact"
                highlight={result.outcome.won ? new Set(maskToIndexes(result.outcome.mask)) : null}
                missing={result.outcome.won ? null : new Set(result.outcome.missingIndexes)}
              />
            </div>
          ))}

          <p className="lot-note">Verde: cartas que sí salieron. Rojo: lo que le falta al patrón más cercano.</p>
        </div>
      )}
    </div>
  );
};

VerifyPanel.propTypes = {
  room: PropTypes.shape({
    gameCode: PropTypes.string.isRequired,
    boardsPerPlayer: PropTypes.number.isRequired,
  }).isRequired,
  drawnCards: PropTypes.arrayOf(PropTypes.number).isRequired,
  typeCard: PropTypes.string.isRequired,
  mode: PropTypes.object.isRequired,
};

export default VerifyPanel;
