import React, { useState } from "react";
import { jsPDF } from "jspdf";

const cardConfigurations = {
  10: { repetitions: { 2: 2, 52: 3 }, total: 10 },
  17: { repetitions: { 52: 5, 2: 6 }, total: 17 },
  27: { repetitions: { 54: 8 }, total: 27 },
};

const BingoCardGenerator = ({ isOpen, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ cards: 0, images: 0, percentage: 0 });

  const generatePDF = async (cardCount) => {
    setIsGenerating(true);
    setProgress({ cards: 0, images: 0, percentage: 0 });

    const config = cardConfigurations[cardCount];
    if (!config) return;

    const images = Array.from({ length: 54 }, (_, i) => i + 1);
    const shuffledImages = shuffleArray(images);
    const cardsImages = distributeImages(shuffledImages, config);

    const pdf = new jsPDF();
    const margin = 72; // 1 inch margin in points
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const usableWidth = pageWidth - 2 * margin;
    const usableHeight = pageHeight - 2 * margin;
    const imageWidth = usableWidth / 4;
    const imageHeight = usableHeight / 4;

    const totalImages = cardCount * 16; // 16 imágenes por cartón

    for (let cardIndex = 0; cardIndex < cardsImages.length; cardIndex++) {
      if (cardIndex > 0 && cardIndex % 16 === 0) {
        pdf.addPage();
      }

      const pageIndex = Math.floor(cardIndex / 16);
      const cardPositionOnPage = cardIndex % 16;
      const x = margin + (cardPositionOnPage % 4) * imageWidth;
      const y = margin + Math.floor((cardPositionOnPage % 16) / 4) * imageHeight;

      await pdf.addImage(`/HDWEBP/${cardsImages[cardIndex]}.webp`, "WEBP", x, y, imageWidth, imageHeight);

      setProgress((prev) => ({
        cards: Math.floor(cardIndex / 16) + 1,
        images: cardIndex + 1,
        percentage: Math.round(((cardIndex + 1) / totalImages) * 100),
      }));

      // Pequeña pausa para permitir que la UI se actualice
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    pdf.save(`bingo_cards_${cardCount}.pdf`);
    setIsGenerating(false);
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const distributeImages = (images, config) => {
    let distributed = [];
    Object.entries(config.repetitions).forEach(([count, repetitions]) => {
      const imagesToDistribute = images.slice(0, count);
      for (let i = 0; i < repetitions; i++) {
        distributed = distributed.concat(shuffleArray(imagesToDistribute));
      }
      images = images.slice(count);
    });

    // Dividir las imágenes distribuidas en cartones de 16 imágenes
    const cards = [];
    for (let i = 0; i < distributed.length; i += 16) {
      cards.push(distributed.slice(i, i + 16));
    }

    // Asegurarse de que no haya repeticiones dentro de cada cartón
    cards.forEach((card) => {
      const uniqueImages = new Set(card);
      if (uniqueImages.size < 16) {
        const remainingImages = images.filter((img) => !card.includes(img));
        while (uniqueImages.size < 16 && remainingImages.length > 0) {
          const randomIndex = Math.floor(Math.random() * remainingImages.length);
          const newImage = remainingImages.splice(randomIndex, 1)[0];
          const indexToReplace = card.findIndex((img) => uniqueImages.has(img));
          card[indexToReplace] = newImage;
          uniqueImages.add(newImage);
        }
      }
    });

    return cards.flat();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 1000000 }}>
      <div className="bg-white p-6 rounded-lg relative" style={{ width: "90%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl font-bold">
          X
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">Imprimir Cartones</h2>
        {isGenerating ? (
          <div className="text-center">
            <div className="mb-2">Generando cartones...</div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-blue-600 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
            </div>
            <div className="mt-2">
              Cartones generados: {progress.cards}
              <br />
              Imágenes colocadas: {progress.images} de {progress.cards * 16}
              <br />
              Progreso total: {progress.percentage}%
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            {Object.keys(cardConfigurations).map((count) => (
              <button
                key={count}
                onClick={() => generatePDF(parseInt(count))}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-semibold transition duration-300"
              >
                {count} cartones
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BingoCardGenerator;
