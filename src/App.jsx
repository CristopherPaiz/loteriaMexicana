import Loteria from "./Loteria";

const styles = `
  .loteria-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: Arial, sans-serif;
  }

  .top-panel {
    display: flex;
    justify-content: center;
    width: 100vw;
    padding-top: 50px;
  }

  .main-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
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

  .card {
    width: 200px;
    height: 320px;
    margin-bottom: 20px;
    cursor: pointer;
    transition: transform 0.3s ease;
  }

  .card:hover {
    transform: scale(1.05);
  }

  .card img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .mini-card {
    width: 50px;
    height: 75px;
    margin: 0 -10px;
    border: 10px solid white;
    border-radius: 10px;
    filter: drop-shadow(0 0 5px rgba(0, 0, 0, 1));
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
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .voice-button:hover {
    background-color: #45a049;
  }

  .voice-button.active {
    background-color: #003a03;
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

   .card {
    width: 200px;
    height: 320px;
    margin-bottom: 20px;
    cursor: pointer;
    transition: transform 0.3s ease;
  }

  .card:hover {
    transform: scale(1.05);
  }

  .card img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .mini-card {
    width: 50px;
    height: 75px;
    margin: 0 -10px;
    border: 10px solid white;
    border-radius: 10px;
    filter: drop-shadow(0 0 5px rgba(0, 0, 0, 1));
  }

  .mini-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .card.playing {
    border: 20px solid white;
    border-radius: 15px;
  }

  .card.paused {
    border: 20px solid red;
    border-radius: 15px;
  }

  p{
  text-align: center;
  opacity: 0.5;
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
