import { useState, useEffect } from "react";
import MiniCard from "./MiniCard";
import PropTypes from "prop-types";
import { FaTimes } from "react-icons/fa";

const TopPanel = ({ pastCards, typeCard, displayedCard, pastCardsAll, getCardImageUrl }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // La más reciente va primero.
  const history = [...pastCardsAll];

  return (
    <>
      <div className="top-panel" onClick={openModal}>
        {pastCards.map((card, index) => (
          <MiniCard
            key={card}
            number={card}
            index={index}
            totalCards={pastCards.length}
            typeCard={typeCard}
            isDisplayed={card === displayedCard}
            imageUrl={getCardImageUrl(card)}
            animate={card === displayedCard}
          />
        ))}
      </div>

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

            <div className="lot-modal__body">
              {history.length === 0 ? (
                <p className="lot-modal__empty">Todavía no ha salido ninguna carta.</p>
              ) : (
                <div className="lot-history">
                  {history.map((card, index) => (
                    <div key={card} className={`lot-history__item ${index === 0 ? "is-latest" : ""}`}>
                      <div className="lot-history__frame">
                        <img src={getCardImageUrl(card)} alt={`Carta ${card}`} loading="lazy" />
                      </div>
                      <span className="lot-history__badge">{history.length - index}</span>
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
