import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import PropTypes from "prop-types";

const configuracionDeCartas = {
  10: { repeticiones: { 2: 2, 52: 3 }, total: 160 },
  17: { repeticiones: { 52: 5, 2: 6 }, total: 272 },
  27: { repeticiones: { 54: 8 }, total: 432 },
};

const LoteriaCardGenerator = ({ isOpen, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("idle");
  const [imagesAdded, setImagesAdded] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [isHalfCard, setIsHalfCard] = useState(true);

  useEffect(() => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    return () => {
      document.body.removeChild(container);
    };
  }, []);

  const createControlTable = (numCards) => {
    const config = configuracionDeCartas[numCards];
    const controlTable = {};

    const allImageNumbers = Array.from({ length: 54 }, (_, i) => i + 1);
    const shuffledImageNumbers = allImageNumbers.sort(() => Math.random() - 0.5);

    let currentIndex = 0;
    for (const [count, repetitions] of Object.entries(config.repeticiones)) {
      const imagesToAssign = parseInt(count);
      for (let i = 0; i < imagesToAssign; i++) {
        const imageNumber = shuffledImageNumbers[currentIndex];
        controlTable[imageNumber] = parseInt(repetitions);
        currentIndex++;
      }
    }

    return controlTable;
  };

  const generateCards = (numCards, controlTable) => {
    const cards = [];
    const allImageNumbers = Object.keys(controlTable).map(Number);
    const cardsPerSheet = 16;
    const debugInfo = {};

    // Crear un pool de imágenes basado en las repeticiones
    let imagePool = allImageNumbers.flatMap((num) => Array(controlTable[num]).fill(num));

    const generateCard = () => {
      const card = [];
      const availableImages = [...allImageNumbers];

      while (card.length < cardsPerSheet && availableImages.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableImages.length);
        const selectedImage = availableImages[randomIndex];

        if (imagePool.includes(selectedImage)) {
          card.push(selectedImage);
          imagePool.splice(imagePool.indexOf(selectedImage), 1);
          availableImages.splice(randomIndex, 1);

          // Debug info
          if (!debugInfo[selectedImage]) {
            debugInfo[selectedImage] = [];
          }
          debugInfo[selectedImage].push(`hoja${cards.length + 1}`);
        } else {
          availableImages.splice(randomIndex, 1);
        }
      }

      return card;
    };

    while (cards.length < numCards) {
      const card = generateCard();
      if (card.length === cardsPerSheet) {
        cards.push(card);
      } else {
        // Si no se pudo generar un cartón válido, reiniciar el proceso
        imagePool = allImageNumbers.flatMap((num) => Array(controlTable[num]).fill(num));
        cards.length = 0;
        Object.keys(debugInfo).forEach((key) => {
          debugInfo[key] = [];
        });
      }

      setProgress(Math.floor((cards.length / numCards) * 50));
      setImagesAdded(cards.length * 16);
    }

    // Verificación final
    const finalCheck = Object.entries(debugInfo).reduce((acc, [image, occurrences]) => {
      acc[image] = occurrences.length;
      return acc;
    }, {});

    const isDistributionCorrect = Object.entries(controlTable).every(([image, count]) => finalCheck[image] === count);

    if (!isDistributionCorrect) {
      throw new Error("La distribución final no coincide con la especificación.");
    }

    // Log debug info
    const debugTable = Object.entries(debugInfo).map(([image, occurrences]) => ({
      imagen: `${image}.webp`,
      ...occurrences.reduce((acc, curr, idx) => ({ ...acc, [`hoja${idx + 1}`]: curr }), {}),
      repeticiones: occurrences.length,
    }));
    console.table(debugTable);

    return cards;
  };

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const generatePDF = async (cards) => {
    if (isHalfCard) {
      const doc = new jsPDF({
        orientation: "landscape", // Establece la orientación horizontal
        unit: "mm", // Configura las unidades en milímetros para mayor precisión
        format: "letter", // Tamaño de carta 11x8.5 pulgadas (horizontal)
      });

      const pageWidth = doc.internal.pageSize.width; // 279.4 mm
      const pageHeight = doc.internal.pageSize.height; // 215.9 mm
      const margin = 20.4; // 1 pulgada en mm
      const separation = 40.8; // 2 pulgadas entre cartones en mm
      const cardWidth = (pageWidth - margin * 2 - separation) / 2; // Ajuste de ancho de cada cartón
      const cardHeight = pageHeight - 2 * margin + 3; // Altura del cartón ocupa toda la página

      const imageCache = {};

      for (let i = 0; i < cards.length; i++) {
        if (i > 0 && (!isHalfCard || i % 2 === 0)) doc.addPage();

        const card = cards[i];
        const xOffset = i % 2 === 0 ? margin : margin + cardWidth + separation; // Calcula la posición X en función del índice
        const yOffset = margin; // El Y siempre es el mismo ya que solo es una fila

        for (let j = 0; j < card.length; j++) {
          const imageNumber = card[j];
          const row = Math.floor(j / 4);
          const col = j % 4;
          const x = xOffset + col * (cardWidth / 4); // Divide el ancho del cartón entre 4 para acomodar las imágenes
          const y = yOffset + row * (cardHeight / 4 - 5); // Divide la altura del cartón entre 4 para las filas

          try {
            let img;
            if (imageCache[imageNumber]) {
              img = imageCache[imageNumber];
            } else {
              img = await loadImage(`/HDWEBP/${imageNumber}.webp`);
              imageCache[imageNumber] = img;
            }

            const aspectRatio = img.width / img.height;

            let drawHeight = cardHeight / 4; // Aumenta la altura de la imagen en 5 px
            let drawWidth = drawHeight * aspectRatio; // Mantén este cálculo para el ancho

            if (drawWidth > cardWidth / 4) {
              drawWidth = cardWidth / 4;
              drawHeight = drawWidth / aspectRatio; // Puedes mantener esto para ajustar el ancho si es necesario
            }

            const imageXOffset = (cardWidth / 4 - drawWidth) / 2;
            const imageYOffset = (cardHeight / 4 - drawHeight) / 2 - 5;

            doc.addImage(img, "WEBP", x + imageXOffset, y + imageYOffset, drawWidth, drawHeight, undefined, "FAST");

            // Add white border
            doc.setDrawColor(255);
            doc.setLineWidth(0.9);
            doc.rect(x + imageXOffset, y + imageYOffset, drawWidth, drawHeight);
            doc.setDrawColor(128, 128, 128);
            doc.setLineWidth(0.1);
            doc.rect(x + imageXOffset + 0.25, y + imageYOffset + 0.25, drawWidth - 0.7, drawHeight - 0.65);
          } catch (error) {
            console.error(`Error loading image ${imageNumber}:`, error);
          }
        }

        setProgress(50 + Math.floor(((i + 1) / cards.length) * 50));
      }

      const date = new Date();
      const dateString = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
      const formatName = isHalfCard ? "media-carta" : "carta";
      doc.save(`cartones loteria ${cards.length} ${formatName} - ${dateString}.pdf`);
    } else {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 25.4; // 1 inch in mm
      const centerMargin = isHalfCard ? 50.8 : margin; // 2 inches in mm for half card
      const availableWidth = pageWidth - 2 * margin;
      const availableHeight = isHalfCard ? (pageHeight - 3 * margin) / 2 : pageHeight - 2 * margin;
      const imageWidth = availableWidth / 4;
      const imageHeight = availableHeight / 4;

      const imageCache = {};

      for (let i = 0; i < cards.length; i++) {
        if (i > 0 && (!isHalfCard || i % 2 === 0)) doc.addPage();

        const card = cards[i];
        for (let j = 0; j < card.length; j++) {
          const imageNumber = card[j];
          const row = Math.floor(j / 4);
          const col = j % 4;
          const x = margin + col * imageWidth;
          const y = isHalfCard ? (i % 2 === 0 ? margin : centerMargin + availableHeight) + row * imageHeight : margin + row * imageHeight;

          try {
            let img;
            if (imageCache[imageNumber]) {
              img = imageCache[imageNumber];
            } else {
              img = await loadImage(`/HDWEBP/${imageNumber}.webp`);
              imageCache[imageNumber] = img;
            }

            const aspectRatio = img.width / img.height;
            let drawWidth = imageWidth;
            let drawHeight = imageWidth / aspectRatio;

            if (drawHeight > imageHeight) {
              drawHeight = imageHeight;
              drawWidth = imageHeight * aspectRatio;
            }

            const xOffset = (imageWidth - drawWidth) / 2;
            const yOffset = (imageHeight - drawHeight) / 2;

            doc.addImage(img, "WEBP", x + xOffset, y + yOffset, drawWidth, drawHeight, undefined, "FAST");

            // Add white border
            doc.setDrawColor(255);
            doc.setLineWidth(0.5);
            doc.rect(x + xOffset, y + yOffset, drawWidth, drawHeight);
          } catch (error) {
            console.error(`Error loading image ${imageNumber}:`, error);
          }
        }

        setProgress(50 + Math.floor(((i + 1) / cards.length) * 50));
      }

      const date = new Date();
      const dateString = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
      const lengthAllSheets = cards.length;
      const formatName = isHalfCard ? "media-carta" : "carta";
      doc.save(`cartones loteria ${lengthAllSheets} ${formatName} - ${dateString}.pdf`);
    }
  };

  const generateCardsAndPDF = async (numCards) => {
    setIsGenerating(true);
    setProgress(0);
    setStage("calculating");
    setImagesAdded(0);
    setTotalImages(configuracionDeCartas[numCards].total);

    try {
      // Simulate initial calculation time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setStage("generating");
      const controlTable = createControlTable(numCards);
      const cards = generateCards(numCards, controlTable);

      setStage("creating_pdf");
      await generatePDF(cards);

      setStage("completed");
    } catch (error) {
      console.error("Error generating cards and PDF:", error);
      alert("Hubo un error al generar los cartones. Por favor, inténtalo de nuevo.");
      setStage("error");
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setStage("idle");
        onClose();
      }, 2000);
    }
  };

  const Loader = () => (
    <div className="loader">
      <div className="spinner"></div>
      <style>{`
        .loader {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 1rem;
        }
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border-left-color: #09f;
          animation: spin 1s ease infinite;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );

  const renderStatus = () => {
    switch (stage) {
      case "calculating":
        return <p className="text-center mt-2">Calculando cartones...</p>;
      case "generating":
        return (
          <>
            <p className="text-center mt-2">Generando cartones: {progress}%</p>
            <p className="text-center mt-1">
              Imágenes agregadas: {imagesAdded} / {totalImages}
            </p>
          </>
        );
      case "creating_pdf":
        return (
          <>
            <p className="text-center mt-2">Creando PDF: {progress}%</p>;
            <p className="text-center mt-1">
              Imágenes agregadas: {imagesAdded} / {totalImages}
            </p>
            <p>
              <small>Este proceso puede tardar unos minutos...</small>
              <br />
              <small>Por favor, no cierres esta ventana.</small>
            </p>
          </>
        );
      case "completed":
        return <p className="text-center mt-2 text-green-600">¡Generación completada!</p>;
      case "error":
        return <p className="text-center mt-2 text-red-600">Error en la generación</p>;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 500000,
        textAlign: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: "20px",
          borderRadius: "0.5rem", // rounded-lg
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)", // shadow-xl
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          overflow: "auto",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem", // text-2xl
            fontWeight: "bold",
            marginBottom: "1rem", // mb-4
          }}
        >
          ¿Cuántos cartones quieres imprimir?
        </h2>
        <div style={{ margin: " 1.5rem 0" }}>
          <label style={{ display: "inline-flex", alignItems: "center" }}>
            <input style={{ fontSize: "2rem" }} type="checkbox" className="form-checkbox" checked={isHalfCard} onChange={() => setIsHalfCard(true)} />
            <span style={{ marginLeft: "0.5rem", fontSize: "1.2rem" }}>Media Carta</span>
          </label>
          <label style={{ display: "inline-flex", alignItems: "center", marginLeft: "1.5rem" }}>
            <input type="checkbox" className="form-checkbox" checked={!isHalfCard} onChange={() => setIsHalfCard(false)} />
            <span style={{ marginLeft: "0.5rem", fontSize: "1.2rem" }}>Carta</span>
          </label>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)", // grid-cols-3
            gap: "0.1rem", // gap-4
            marginBottom: "1rem", // mb-4
          }}
        >
          {Object.keys(configuracionDeCartas).map((numCards) => (
            <button
              key={numCards}
              onClick={() => generateCardsAndPDF(parseInt(numCards))}
              style={{
                backgroundColor: "#3B82F6", // bg-blue-500
                color: "white",
                fontWeight: "bold",
                padding: "0.5rem 1rem", // py-2 px-4
                borderRadius: "0.25rem", // rounded
                cursor: isGenerating ? "not-allowed" : "pointer",
              }}
              disabled={isGenerating}
            >
              {numCards} Cartones
            </button>
          ))}
        </div>
        {isGenerating && (
          <div style={{ marginTop: "1rem" }}>
            <div
              style={{
                width: "100%",
                backgroundColor: "#E5E7EB", // bg-gray-200
                borderRadius: "9999px", // rounded-full
                height: "0.625rem", // h-2.5
              }}
            >
              <div
                style={{
                  backgroundColor: "#3B82F6", // bg-blue-600
                  height: "100%",
                  borderRadius: "9999px", // rounded-full
                  transition: "width 0.3s", // transition-all duration-300
                  width: `${progress}%`,
                }}
              ></div>
            </div>
            {renderStatus()}
            <Loader />
          </div>
        )}
        <button
          onClick={onClose}
          style={{
            marginTop: "1rem", // mt-4
            backgroundColor: "red", // bg-gray-300
            color: "white",
            fontWeight: "bold",
            padding: "1rem 2rem", // py-2 px-4
            borderRadius: "0.25rem", // rounded
            cursor: isGenerating ? "not-allowed" : "pointer",
          }}
          disabled={isGenerating}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default LoteriaCardGenerator;

LoteriaCardGenerator.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
