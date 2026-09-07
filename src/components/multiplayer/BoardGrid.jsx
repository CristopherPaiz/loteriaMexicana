import PropTypes from "prop-types";
import CardImage from "../CardImage";
import { BOARD_COLUMNS } from "../../multiplayer/modes";
import { markerFor } from "../../multiplayer/markers";

// El cartón del jugador no usa la caché de blobs de la partida del anfitrión:
// pide las imágenes directamente y deja que el service worker las sirva.
const directImage = () => "";

/**
 * Rejilla 4x4 de un cartón.
 *
 * - `marked`: casillas con marcador (las pone el jugador a mano, a propósito).
 * - `highlight`: casillas del patrón ganador, para resaltarlo al verificar.
 * - `missing`: casillas que le faltaban al patrón más cercano.
 */
const BoardGrid = ({ board, marked, onToggle = null, typeCard = "HD", highlight = null, missing = null, size = "normal", marker = "frijol", context = "juego" }) => (
  <div
    /* La clase del tipo (o de la verificación) elige qué par de variables
       de brillo se aplica: ver la cabecera de mp.css. */
    className={`mp-board mp-board--${size} mp-board--${context === "verificar" ? "verificar" : marker}`}
    style={{ "--mp-board-cols": BOARD_COLUMNS }}
    role={onToggle ? "group" : "img"}
    aria-label={onToggle ? "Cartón: toca una carta para poner tu marcador" : "Cartón"}
  >
    {board.map((card, index) => {
      const isMarked = marked.has(index);
      const classes = ["mp-cell", isMarked ? "is-marked" : "", highlight?.has(index) ? "is-winning" : "", missing?.has(index) ? "is-missing" : ""]
        .filter(Boolean)
        .join(" ");

      // Se calcula siempre, no solo al marcar: así el sprite ya está decidido
      // cuando aparece y la animación no lo cambia a mitad de camino.
      const piece = markerFor(marker, `${card}-${index}`);

      const content = (
        <>
          <CardImage card={card} typeCard={typeCard} getCardImageUrl={directImage} alt={`Carta ${card}`} className="mp-cell__img" loading="lazy" />
          {isMarked && (
            <img
              className="mp-cell__marker"
              src={piece.src}
              alt=""
              aria-hidden="true"
              draggable="false"
              /* Como variables, no como transform: así la animación de caída
                 puede componer el mismo giro y desplazamiento sin pisarlos. */
              style={{
                "--mp-dx": `${piece.offsetX}%`,
                "--mp-dy": `${piece.offsetY}%`,
                "--mp-rot": `${piece.rotation}deg`,
                "--mp-scale": piece.scale,
              }}
            />
          )}
        </>
      );

      // Sin onToggle la rejilla es solo lectura (pantalla de verificación del
      // anfitrión): un div evita meter 16 botones inertes en la navegación.
      if (!onToggle) {
        return (
          <div key={`${card}-${index}`} className={classes}>
            {content}
          </div>
        );
      }

      return (
        <button
          key={`${card}-${index}`}
          type="button"
          className={classes}
          onClick={() => onToggle(index)}
          aria-pressed={isMarked}
          aria-label={`Carta ${card}${isMarked ? ", marcada" : ""}`}
        >
          {content}
        </button>
      );
    })}
  </div>
);

BoardGrid.propTypes = {
  board: PropTypes.arrayOf(PropTypes.number).isRequired,
  marked: PropTypes.instanceOf(Set).isRequired,
  onToggle: PropTypes.func,
  typeCard: PropTypes.string,
  highlight: PropTypes.instanceOf(Set),
  missing: PropTypes.instanceOf(Set),
  size: PropTypes.oneOf(["normal", "compact"]),
  marker: PropTypes.string,
  context: PropTypes.oneOf(["juego", "verificar"]),
};

export default BoardGrid;
