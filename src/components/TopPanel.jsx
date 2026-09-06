import { useState, useEffect, useLayoutEffect, useRef } from "react";
import MiniCard from "./MiniCard";
import CardImage from "./CardImage";
import PropTypes from "prop-types";
import { FaTimes } from "react-icons/fa";

const SHIFT_DURATION = 480;
const SHIFT_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

const TopPanel = ({ pastCards, typeCard, displayedCard, pastCardsAll, getCardImageUrl }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const bodyRef = useRef(null);
  const trailRef = useRef(null);
  const rectsRef = useRef(new Map());
  const [ghosts, setGhosts] = useState([]);

  // La fila está centrada y acotada a N cartas: al entrar una nueva, las demás
  // cambian de sitio por reflujo, que el CSS no puede animar. Con FLIP se mide
  // dónde estaba cada carta y se la desplaza desde ahí hasta su nuevo hueco.
  // La que se cae del tope se guarda como "fantasma" para fundirla en su último
  // sitio, porque React ya sacó su nodo del árbol.
  useLayoutEffect(() => {
    const row = trailRef.current;
    if (!row) return;

    const previous = rectsRef.current;
    const current = new Map();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    row.querySelectorAll("[data-card]").forEach((node) => {
      const id = node.dataset.card;
      const rect = node.getBoundingClientRect();
      current.set(id, rect);

      // Las que acaban de entrar traen su propia animación de aparición.
      const before = previous.get(id);
      if (!before || reduceMotion || typeof node.animate !== "function") return;

      const dx = before.left - rect.left;
      if (Math.abs(dx) < 0.5) return;

      node.animate([{ transform: `translateX(${dx}px)` }, { transform: "translateX(0)" }], {
        duration: SHIFT_DURATION,
        easing: SHIFT_EASING,
      });
    });

    const gone = [];
    previous.forEach((rect, id) => {
      if (!current.has(id)) gone.push({ card: Number(id), rect });
    });

    rectsRef.current = current;
    if (gone.length && !reduceMotion) setGhosts((prev) => [...prev, ...gone]);
  }, [pastCards]);

  // Los fantasmas se retiran cuando termina el fundido.
  useEffect(() => {
    if (ghosts.length === 0) return undefined;
    const timer = setTimeout(() => setGhosts([]), SHIFT_DURATION);
    return () => clearTimeout(timer);
  }, [ghosts]);

  // El historial va en orden de salida, así que la última carta queda al final:
  // se abre ya desplazado abajo para no obligar a bajar a mano.
  useEffect(() => {
    if (isModalOpen && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [isModalOpen]);

  const openModal = () => pastCardsAll.length > 0 && setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    if (!isModalOpen) return undefined;

    // El botón atrás del móvil cierra el modal en vez de salir del juego.
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => setIsModalOpen(false);
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsModalOpen(false);
    };

    window.addEventListener("popstate", handlePopState);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  // Ambas listas van en orden de salida: la más reciente al final, o sea a la
  // derecha en la barra y abajo del todo en el historial.
  const trail = [...pastCards].reverse();
  const history = [...pastCardsAll].reverse();

  return (
    <>
      {/* Sin cartas todavía la barra no ocupa alto: ese espacio se lo queda el
          título de la portada. */}
      <div className={`top-panel ${trail.length === 0 ? "is-empty" : ""}`} ref={trailRef} onClick={openModal}>
        {trail.map((card, index) => (
          <MiniCard
            key={card}
            number={card}
            index={index}
            totalCards={trail.length}
            typeCard={typeCard}
            isDisplayed={card === displayedCard}
            imageUrl={getCardImageUrl(card)}
            animate={card === displayedCard}
          />
        ))}
      </div>

      {ghosts.map(({ card, rect }) => (
        <div
          key={`ghost-${card}`}
          className="mini-card lot-mini-ghost"
          style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
          aria-hidden="true"
        >
          <img src={getCardImageUrl(card)} alt="" />
        </div>
      ))}

      {isModalOpen && (
        <div className="lot-modal-overlay" onClick={closeModal}>
          <div className="lot-modal" role="dialog" aria-modal="true" aria-label="Cartas que ya salieron" onClick={(e) => e.stopPropagation()}>
            <header className="lot-modal__header">
              <div className="lot-modal__heading">
                <h2 className="lot-modal__title">Cartas que ya salieron</h2>
                <span className="loteria-progress-pill">{history.length}</span>
              </div>
              <button type="button" className="lot-panel__close" onClick={closeModal} aria-label="Cerrar historial">
                <FaTimes />
              </button>
            </header>

            <div className="lot-modal__body" ref={bodyRef}>
              {history.length === 0 ? (
                <p className="lot-modal__empty">Todavía no ha salido ninguna carta.</p>
              ) : (
                <div className="lot-history">
                  {history.map((card, index) => (
                    <div key={card} className={`lot-history__item ${index === history.length - 1 ? "is-latest" : ""}`}>
                      <div className="lot-history__frame">
                        <CardImage card={card} typeCard={typeCard} getCardImageUrl={getCardImageUrl} alt={`Carta ${card}`} loading="lazy" />
                      </div>
                      <span className="lot-history__badge">{index + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

TopPanel.propTypes = {
  pastCards: PropTypes.arrayOf(PropTypes.number).isRequired,
  typeCard: PropTypes.string.isRequired,
  displayedCard: PropTypes.number,
  pastCardsAll: PropTypes.arrayOf(PropTypes.number).isRequired,
  getCardImageUrl: PropTypes.func.isRequired,
};

export default TopPanel;
