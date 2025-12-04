import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const LoadingScreen = ({ onComplete, assets }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Preparando la Lotería...");

  useEffect(() => {
    const messages = [
      "Limpiando la mesa...",
      "Buscando los frijolitos...",
      "Llamando a los abuelos...",
      "Barajando la suerte...",
      "Afinando la garganta...",
      "Barajando los cartones...",
      "¡Corre y se va corriendo!",
    ];
    let msgIndex = 0;

    const intervalId = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setLoadingText(messages[msgIndex]);
    }, 1500);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!assets || assets.length === 0) {
      onComplete();
      return;
    }

    let isMounted = true;
    let loaded = 0;
    const cache = {};
    const total = assets.length;

    const loadAsset = async (src) => {
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        cache[src] = blobUrl;
        return src;
      } catch (error) {
        console.error(`Failed to load asset: ${src}`, error);
        return src; // Resolve anyway to continue
      }
    };

    const loadAll = async () => {
      // Load in chunks to avoid freezing UI
      const chunkSize = 5;
      for (let i = 0; i < total; i += chunkSize) {
        if (!isMounted) return;
        const chunk = assets.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map((src) =>
            loadAsset(src).then(() => {
              if (isMounted) {
                loaded++;
                setProgress(Math.round((loaded / total) * 100));
              }
            })
          )
        );
      }
      if (isMounted) {
        // Small delay to show 100%
        setTimeout(() => onComplete(cache), 800);
      }
    };

    loadAll();

    return () => {
      isMounted = false;
    };
  }, [assets, onComplete]);

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="spinner">
          <div className="double-bounce1"></div>
          <div className="double-bounce2"></div>
        </div>
        <h1 className="loading-title">{loadingText}</h1>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}>
            <div className="progress-bar-glow"></div>
          </div>
        </div>
        <p className="loading-text">{progress}%</p>
      </div>

      <div className="loading-footer">
        <p>Hecho por Cristopher Paiz</p>
      </div>

      <style>{`
        .loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100dvh;
          background: radial-gradient(circle at center, #2b2f3a 0%, #1a1c20 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 30000;
          color: white;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          flex-direction: column;
        }
        .loading-content {
          text-align: center;
          width: 80%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          justify-content: center;
        }
        .loading-title {
          font-size: 1.5rem;
          margin-bottom: 20px;
          font-weight: 300;
          letter-spacing: 1px;
          min-height: 2rem; /* Prevent layout shift */
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .progress-bar-container {
          width: 100%;
          height: 8px;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 15px;
          position: relative;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #4CAF50, #8BC34A);
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          border-radius: 10px;
        }
        .progress-bar-glow {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.3) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .loading-text {
          font-size: 0.9rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          font-variant-numeric: tabular-nums;
        }

        /* Spinner Animation */
        .spinner {
          width: 50px;
          height: 50px;
          position: relative;
          margin: 0 auto 30px auto;
        }
        .double-bounce1, .double-bounce2 {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: #4CAF50;
          opacity: 0.6;
          position: absolute;
          top: 0;
          left: 0;
          animation: sk-bounce 2.0s infinite ease-in-out;
        }
        .double-bounce2 {
          animation-delay: -1.0s;
          background-color: #8BC34A;
        }
        @keyframes sk-bounce {
          0%, 100% { transform: scale(0.0); }
          50% { transform: scale(1.0); }
        }

        .loading-footer {
          padding-bottom: 30px;
          opacity: 0.5;
          font-size: 0.85rem;
          letter-spacing: 0.5px;
          font-weight: 300;
        }
      `}</style>
    </div>
  );
};

LoadingScreen.propTypes = {
  onComplete: PropTypes.func.isRequired,
  assets: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default LoadingScreen;
