import { useState, useEffect, useRef } from "react";
import TopPanel from "./components/TopPanel";
import MainPanel from "./components/MainPanel";
import RightPanel from "./components/RightPanel";
import MenuButton from "./components/MenuButton";

const TIME_BETWEEN_CARDS = 4;
const INITIAL_CARD_STYLE = "HD"; // HD or SD
const CARD_LENGTH = 54;
const CARD_SHOW_TOP_MOBILE = 5;
const CARD_SHOW_TOP_DESKTOP = 10;
const isMobile = window.innerWidth <= 768;

const Loteria = () => {
  const [currentCard, setCurrentCard] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [deck, setDeck] = useState([]);
  const [pastCards, setPastCards] = useState([]);
  const voice = ["hombre", "mujer", "nino", "joven"];
  const [activeVoice, setActiveVoice] = useState(voice[Math.floor(Math.random() * voice.length)]);
  const [showMenu, setShowMenu] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const [time, setTime] = useState(TIME_BETWEEN_CARDS);
  const [typeCard, setTypeCard] = useState(INITIAL_CARD_STYLE);

  const initializeDeck = () => {
    return Array.from({ length: CARD_LENGTH }, (_, i) => i + 1);
  };

  const shuffleDeck = (deckToShuffle) => {
    for (let i = deckToShuffle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckToShuffle[i], deckToShuffle[j]] = [deckToShuffle[j], deckToShuffle[i]];
    }
    return deckToShuffle;
  };

  useEffect(() => {
    const shuffledDeck = shuffleDeck(initializeDeck());
    setDeck(shuffledDeck);
  }, []);

  useEffect(() => {
    if (isPlaying && !isPaused) {
      timerRef.current = setTimeout(drawNextCard, time * 1000);
    } else {
      clearTimeout(timerRef.current);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, isPaused, currentCard]);

  // Evitar salir o recargar la página accidentalmente
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = ""; // Chrome requiere este retorno para mostrar la advertencia
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const startGame = () => {
    const shuffledDeck = shuffleDeck(initializeDeck());
    setDeck(shuffledDeck);
    setIsPlaying(true);
    setIsPaused(false);
    setPastCards([]);
    drawNextCard();
  };

  const drawNextCard = () => {
    if (deck.length > 0) {
      const newCard = deck.pop();
      setCurrentCard(newCard);
      setPastCards((prev) => [newCard, ...prev].slice(0, isMobile ? CARD_SHOW_TOP_MOBILE : CARD_SHOW_TOP_DESKTOP));
      setDeck([...deck]);
      playSound(newCard);
    } else {
      setIsPlaying(false);
    }
  };

  const playSound = (cardNumber) => {
    if (audioRef.current) {
      audioRef.current.src = `/sounds/${activeVoice}/${cardNumber}. ${activeVoice}.mp3`;
      audioRef.current.play();
    }
  };

  const togglePlay = () => {
    setIsPaused(!isPaused);
  };

  const handleVoiceChange = (voice) => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      setActiveVoice(voice);
      audioRef.current.src = `/sounds/${voice}/${currentCard}. ${voice}.mp3`;
      audioRef.current.currentTime = currentTime;
      if (!audioRef.current.paused) {
        audioRef.current.play();
      }
    } else {
      setActiveVoice(voice);
    }
  };

  const stopGame = () => {
    if (window.confirm("¿Estás seguro de que quieres detener el juego? Esto reiniciará todo.")) {
      setIsPlaying(false);
      setIsPaused(false);
      clearTimeout(timerRef.current);
      setDeck(shuffleDeck(initializeDeck()));
      setPastCards([]);
      setCurrentCard(1);
    }
  };

  return (
    <div className="loteria-container">
      <TopPanel pastCards={pastCards} typeCard={typeCard} />
      {isMobile && <h1 style={{ textAlign: "center", margin: "0px 5px 10px 5px" }}>Lotería Mexicana</h1>}
      {!isMobile && !isPlaying && <h1 style={{ textAlign: "center", margin: "0px 5px 10px 5px" }}>Lotería Mexicana</h1>}
      <MainPanel
        currentCard={currentCard}
        togglePlay={togglePlay}
        startGame={startGame}
        drawNextCard={drawNextCard}
        stopGame={stopGame}
        isPlaying={isPlaying}
        isPaused={isPaused}
        typeCard={typeCard}
      />
      <p>* Da toca la imagen para pausar el juego</p>
      <RightPanel
        showMenu={showMenu}
        activeVoice={activeVoice}
        handleVoiceChange={handleVoiceChange}
        setShowMenu={setShowMenu}
        setTime={setTime}
        time={time}
        typeCard={typeCard}
        setTypeCard={setTypeCard}
      />
      <MenuButton onClick={() => setShowMenu(!showMenu)} />
      <audio ref={audioRef} />
    </div>
  );
};

export default Loteria;
