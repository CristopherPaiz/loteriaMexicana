import Loteria from "./Loteria";

const styles = `
  .loteria-container {
    display: flex;
    flex-direction: column;
    font-family: Arial, sans-serif;
    position: relative;
  }

  .top-panel {
    display: flex;
    justify-content: center;
    width: 100vw;
    padding-top: 50px;
    position: relative;
    z-index: 10;
  }

  .main-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    position: relative;
    z-index: 5;
  }

  .right-panel {
    display: none;
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    width: 200px;
    background-color: #e0e0e0;
    padding: 20px;
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
    z-index: 1000;
  }

  .right-panel.show {
    display: block;
    transform: translateX(0);
    transition: transform 1s all;
  }

  .menu-button {
    position: fixed;
    right: 10px;
    top: 10px;
    z-index: 1000;
    background: none;
    border: none;
    cursor: pointer;
  }

  /* Deshabilitar estos estilos para evitar conflictos */
  /*
  .card {
    width: 200px;
    height: 320px;
    margin-bottom: 20px;
    cursor: pointer;
    transition: transform 0.3s ease;
    position: relative;
  }

  .card:hover {
    transform: scale(1.05);
  }

  .card img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  */

  .mini-card {
    width: 50px;
    height: 75px;
    margin: 0 -10px;
    border: 10px solid white;
    border-radius: 10px;
    filter: drop-shadow(0 0 5px rgba(0, 0, 0, 1));
    position: relative;
    z-index: 5;
  }

  .mini-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .voice-button {
    display: block;
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    background-color: #187a1b;
    color: white;
    border: none;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .voice-button:hover {
    background-color: #4eca52;
  }

  .voice-button.active {
    background-color: #4eca52;
  }

  button {
    padding: 10px 20px;
    margin: 10px;
    background-color: #008CBA;
    color: white;
    border: none;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  button:hover {
    background-color: #007B9A;
  }

  /* Deshabilitar estilos conflictivos de bordes */
  /*
  .card.playing {
    border: 20px solid white;
    border-radius: 15px;
  }

  .card.paused {
    border: 20px solid red;
    border-radius: 15px;
  }
  */

  p {
    text-align: center;
    opacity: 0.5;
    position: relative;
    z-index: 5;
  }

  .game-over {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 400px;
    position: relative;
    z-index: 10;
  }

  .title {
    text-align: center;
    margin: 0px 5px 10px 5px;
    position: relative;
    z-index: 5;
    color: white;
    font-size: 2rem;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 6px 12px rgba(76, 175, 80, 0.4);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    }
  }

  @media (max-width: 768px) {
    .right-panel {
      width: 50%;
      z-index: 10000;
    }
  }
`;

function App() {
  return (
    <>
      <style>{styles}</style>
      <Loteria />
    </>
  );
}

export default App;
