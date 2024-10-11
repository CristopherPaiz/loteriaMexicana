import { useState, useEffect } from "react";
import MiniCard from "./MiniCard";
import PropTypes from "prop-types";

const TopPanel = ({ pastCards, typeCard, displayedCard, pastCardsAll }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    const handlePopState = (event) => {
      if (isModalOpen) {
        event.preventDefault();
        closeModal();
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (isModalOpen) {
      window.history.pushState(null, "", window.location.href);
    }
  }, [isModalOpen]);

  return (
    <>
      <div className="top-panel" style={{ position: "relative", height: "100px", cursor: "pointer" }} onClick={openModal}>
        {pastCards.map((card, index) => (
          <MiniCard key={card} number={card} index={index} totalCards={pastCards.length} typeCard={typeCard} isDisplayed={card === displayedCard} />
        ))}
      </div>
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              width: "80%",
              height: "80%",
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "20px",
                backgroundColor: "#f0f0f0",
                borderBottom: "1px solid #ddd",
                position: "sticky",
                top: 0,
                zIndex: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ margin: 0, color: "black" }}>Todas las Cartas</h2>
              <div onClick={closeModal} style={{ cursor: "pointer", color: "black" }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M18 6l-12 12" />
                  <path d="M6 6l12 12" />
                </svg>
              </div>
            </div>
            <div
              style={{
                padding: "20px",
                overflowY: "auto",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                gap: "20px",
                justifyContent: "center",
              }}
            >
              {[...pastCardsAll].reverse().map((card, index) => (
                <div key={card} style={{ position: "relative" }}>
                  <img src={`/${typeCard}WEBP/${card}.webp`} alt={`Carta ${card}`} style={{ width: "100%", height: "auto" }} />
                  <div
                    style={{
                      position: "absolute",
                      top: "0px",
                      right: "0px",
                      width: "20px",
                      height: "20px",
                      backgroundColor: "#008e2d",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "12px",
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>
                </div>
              ))}
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
};

export default TopPanel;
