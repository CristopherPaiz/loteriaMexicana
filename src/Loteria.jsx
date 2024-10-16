import { useState, useEffect, useRef } from "react";
import TopPanel from "./components/TopPanel";
import MainPanel from "./components/MainPanel";
import RightPanel from "./components/RightPanel";
import MenuButton from "./components/MenuButton";
import LoteriaCardGenerator from "./components/LoteriaCardGenerator";

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
  const [pastCardsAll, setPastCardsAll] = useState([]);
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
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(TIME_BETWEEN_CARDS);
  const [isReset, setIsReset] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    let intervalId;
    if (isPlaying && !isPaused && countdown > 0) {
      intervalId = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, isPaused, countdown]);

  useEffect(() => {
    if (countdown === 0 && isPlaying && !isPaused) {
      drawNextCard();
    }
  }, [countdown, isPlaying, isPaused]);

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
    setPastCardsAll([]);
    setGameOver(false);
    playSound("0. barajar");

    if (!isReset && time >= 4) {
      setTimeout(() => {
        playSoundStart();
      }, 2000);
    }
  };

  const changeSoundTimerRef = useRef(null); // Nueva referencia para el temporizador del sonido

  const drawNextCard = () => {
    clearTimeout(timerRef.current); // Limpiar cualquier temporizador pendiente
    clearTimeout(changeSoundTimerRef.current); // Limpiar temporizador de cambio de carta pendiente

    if (deck.length > 0) {
      const newCard = deck.pop();

      // Detener cualquier sonido en curso antes de encolar el nuevo sonido de "cambio carta"
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0; // Reiniciar el audio actual
      }

      if (time >= 4) {
        // Reproducir el sonido de "cambio carta" 500ms antes del cambio
        changeSoundTimerRef.current = setTimeout(() => {
          playSound("0. cambio carta");
        }, time * 1000 - 500); // Reproduce 500ms antes del tiempo de la carta
      }

      // Luego reproducir el sonido de la carta
      playCardSound(newCard);

      setCurrentCard(newCard);
      setDeck([...deck]);
      setIsImageLoaded(false);
      setDisplayedCard(newCard);
      setPastCards((prev) => [newCard, ...prev].slice(0, isMobile ? CARD_SHOW_TOP_MOBILE : CARD_SHOW_TOP_DESKTOP));
      setPastCardsAll((prev) => [newCard, ...prev]);
      setCountdown(time);
    } else {
      setIsPlaying(false);
      setGameOver(true);
    }
  };

  const playSound = (soundName) => {
    if (audioRef.current) {
      audioRef.current.pause(); // Detener el sonido actual
      audioRef.current.src = `/sounds/sounds/${soundName}.mp3`;
      audioRef.current.load(); // Asegurar que el nuevo sonido esté listo para reproducir
      audioRef.current.play();
    }
  };

  const playSoundStart = () => {
    if (audioRef.current) {
      audioRef.current.pause(); // Detener el sonido actual
      audioRef.current.src = `/sounds/mujer/1. mujer apertura.mp3`;
      audioRef.current.load(); // Asegurar que el nuevo sonido esté listo para reproducir
      audioRef.current.play();
    }
  };

  const playCardSound = (cardNumber) => {
    if (audioRef.current) {
      audioRef.current.pause(); // Detener el sonido actual
      audioRef.current.src = `/sounds/${activeVoice}/${cardNumber}. ${activeVoice}.mp3`;
      audioRef.current.load(); // Asegurar que el nuevo sonido esté listo para reproducir
      audioRef.current.play();
    }
  };

  const togglePlay = () => {
    setIsPaused(!isPaused);
    playSound(isPaused ? "0. play" : "0. pause");
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
      setPastCardsAll([]);
      setCurrentCard(1);
      setIsImageLoaded(false);
      setNextImageUrl("");
      setGameOver(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  return (
    <div className="loteria-container relative">
      <TopPanel pastCards={pastCards} typeCard={typeCard} displayedCard={displayedCard} pastCardsAll={pastCardsAll} />
      {isMobile && <h1 className="title">Lotería Mexicana</h1>}
      {pastCardsAll.length > 0 && (
        <div style={{ textAlign: "center", fontSize: 15, position: "absolute", left: "0", top: "10px", right: "0" }}>
          {pastCardsAll.length} / 54 (quedan {deck.length} cartas)
        </div>
      )}
      {!isMobile && !isPlaying && <h1 className="title">Lotería Mexicana</h1>}
      {gameOver ? (
        <div className="game-over">
          <h2>Se han acabado todas las cartas</h2>
          <button
            onClick={() => {
              setIsReset(true);
              startGame();
            }}
          >
            Reiniciar juego
          </button>
        </div>
      ) : (
        <>
          <div style={{ position: "relative" }}>
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
            {isPlaying && !isPaused && (
              <div>
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    color: "white",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "20px",
                  }}
                >
                  {countdown}
                </div>
              </div>
            )}
          </div>
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
        </>
      )}
      <audio ref={audioRef} />
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
        <button style={{ padding: "0.7rem 1.5rem", backgroundColor: "" }} onClick={() => setIsModalOpen(true)}>
          Generador de Cartones
        </button>
      </div>
      <LoteriaCardGenerator isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Loteria;
