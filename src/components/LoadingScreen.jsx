import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const LoadingScreen = ({ onComplete, assets }) => {
  const [progress, setProgress] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [currentAsset, setCurrentAsset] = useState("");

  useEffect(() => {
    if (!assets || assets.length === 0) {
      onComplete();
      return;
    }

    let isMounted = true;
    let loaded = 0;
    const total = assets.length;

    const loadAsset = async (src) => {
      return new Promise((resolve) => {
        if (src.endsWith(".mp3") || src.endsWith(".wav")) {
          const audio = new Audio();
          audio.oncanplaythrough = () => resolve(src);
          audio.onerror = () => resolve(src); // Resolve anyway to not block
          audio.src = src;
          audio.load();
        } else {
          const img = new Image();
          img.onload = () => resolve(src);
          img.onerror = () => resolve(src);
          img.src = src;
        }
      });
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
                setLoadedCount(loaded);
                setProgress(Math.round((loaded / total) * 100));
                setCurrentAsset(src.split("/").pop());
              }
            })
          )
        );
      }
      if (isMounted) {
        // Small delay to show 100%
        setTimeout(onComplete, 500);
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
        <h1>Cargando Lotería...</h1>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <p className="loading-text">
          {progress}% - {loadedCount}/{assets.length}
        </p>
        <p className="asset-name">{currentAsset}</p>
      </div>
      <style>{`
        .loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: #2b2f3a;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          color: white;
          font-family: Arial, sans-serif;
        }
        .loading-content {
          text-align: center;
          width: 80%;
          max-width: 400px;
        }
        .progress-bar-container {
          width: 100%;
          height: 20px;
          background-color: #1a1d24;
          border-radius: 10px;
          overflow: hidden;
          margin: 20px 0;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #4CAF50, #8BC34A);
          transition: width 0.3s ease-out;
        }
        .loading-text {
          font-size: 1.2rem;
          font-weight: bold;
        }
        .asset-name {
          font-size: 0.8rem;
          opacity: 0.6;
          margin-top: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
