import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const LoadingScreen = ({ onComplete, assets }) => {
  const [progress, setProgress] = useState(0);

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
        <h1 className="loading-title">Preparando la Lotería...</h1>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}>
            <div className="progress-bar-glow"></div>
          </div>
        </div>
        <p className="loading-text">{progress}%</p>
      </div>
      <style>{`
        .loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #1a1c20 0%, #2b2f3a 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          color: white;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .loading-content {
          text-align: center;
          width: 80%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .loading-title {
          font-size: 1.5rem;
          margin-bottom: 20px;
          font-weight: 300;
          letter-spacing: 1px;
        }
        .progress-bar-container {
          width: 100%;
          height: 10px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 15px;
          position: relative;
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #00c6ff, #0072ff);
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          border-radius: 5px;
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
            rgba(255, 255, 255, 0.4) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .loading-text {
          font-size: 1rem;
          font-weight: bold;
          color: rgba(255, 255, 255, 0.8);
        }

        /* Spinner Animation */
        .spinner {
          width: 40px;
          height: 40px;
          position: relative;
          margin: 0 auto 20px auto;
        }
        .double-bounce1, .double-bounce2 {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: #00c6ff;
          opacity: 0.6;
          position: absolute;
          top: 0;
          left: 0;
          animation: sk-bounce 2.0s infinite ease-in-out;
        }
        .double-bounce2 {
          animation-delay: -1.0s;
          background-color: #0072ff;
        }
        @keyframes sk-bounce {
          0%, 100% { transform: scale(0.0); }
          50% { transform: scale(1.0); }
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
