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
const PRELOAD_TIME = 1; // Tiempo en segundos para precargar la siguiente imagen
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
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [nextImageUrl, setNextImageUrl] = useState("");

  const [displayedCard, setDisplayedCard] = useState(null);

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

      // Precargar la siguiente imagen
      const preloadTimer = setTimeout(() => {
        if (deck.length > 0) {
          const nextCardNumber = deck[deck.length - 1];
          preloadImage(nextCardNumber);
        }
      }, (time - PRELOAD_TIME) * 1000);

      return () => {
        clearTimeout(timerRef.current);
        clearTimeout(preloadTimer);
      };
    } else {
      clearTimeout(timerRef.current);
    }
  }, [isPlaying, isPaused, currentCard, deck, time, typeCard]);

  useEffect(() => {
    if (isPlaying || isPaused) {
      const handleBeforeUnload = (event) => {
        event.preventDefault();
        event.returnValue = "";
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [isPaused, isPlaying]);

  const preloadImage = (cardNumber) => {
    const imageUrl = `/${typeCard}WEBP/${cardNumber}.webp`;
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setIsImageLoaded(true);
      setNextImageUrl(imageUrl);
    };
    img.onerror = () => setIsImageLoaded(false);
  };

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
      setDeck([...deck]);
      playSound(newCard);
      setIsImageLoaded(false);

      // Actualizamos displayedCard después de un pequeño retraso
      setDisplayedCard(newCard);
      setPastCards((prev) => [newCard, ...prev].slice(0, isMobile ? CARD_SHOW_TOP_MOBILE : CARD_SHOW_TOP_DESKTOP));
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
      setIsImageLoaded(false);
      setNextImageUrl("");
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  return (
    <div className="loteria-container">
      <TopPanel pastCards={pastCards} typeCard={typeCard} displayedCard={displayedCard} />
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
        isImageLoaded={isImageLoaded}
        nextImageUrl={nextImageUrl}
      />
      <p>* Toca la imagen para pausar el juego</p>
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
