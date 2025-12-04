import { useState, useEffect, useRef } from "react";
import TopPanel from "./components/TopPanel";
import MainPanel from "./components/MainPanel";
import RightPanel from "./components/RightPanel";
import MenuButton from "./components/MenuButton";
import LoteriaCardGenerator from "./components/LoteriaCardGenerator";
import CountdownTimer from "./components/CountdownTimer";
import LoadingScreen from "./components/LoadingScreen";
import "./Loteria.css";

const TIME_BETWEEN_CARDS = 5;
const INITIAL_CARD_STYLE = "HD"; // HD o SD
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
  const [activeVoice, setActiveVoice] = useState(voice[1]);
  const [showMenu, setShowMenu] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const changeSoundTimerRef = useRef(null);
  // Eliminamos soundQueueRef y isPlayingAudioRef para evitar colas
  const [time, setTime] = useState(TIME_BETWEEN_CARDS);
  const [typeCard, setTypeCard] = useState(INITIAL_CARD_STYLE);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [nextImageUrl, setNextImageUrl] = useState("");
  const [displayedCard, setDisplayedCard] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(TIME_BETWEEN_CARDS);
  const [isReset, setIsReset] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [assetsToLoad, setAssetsToLoad] = useState([]);

  useEffect(() => {
    // Generar lista de assets para precargar
    const images = Array.from({ length: CARD_LENGTH }, (_, i) => `/${typeCard}WEBP/${i + 1}.webp`);
    const sounds = [
      "/sounds/sounds/0. barajar.mp3",
      "/sounds/sounds/0. cambio carta.mp3",
      "/sounds/sounds/0. play.mp3",
      "/sounds/sounds/0. pause.mp3",
      "/sounds/mujer/1. mujer apertura.mp3",
    ];
    setAssetsToLoad([...images, ...sounds]);
  }, [typeCard]); // Recargar si cambia el tipo de carta (HD/SD)

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

  // Función para reproducir audio inmediatamente, cortando el anterior
  const playAudioImmediate = (src, callback) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = src;

      const handleEnded = () => {
        if (callback) callback();
        audioRef.current.removeEventListener("ended", handleEnded);
      };

      audioRef.current.addEventListener("ended", handleEnded);

      audioRef.current.play().catch((err) => {
        console.error("Error al reproducir audio:", err);
        // Si falla, ejecutamos el callback de todos modos para no detener la lógica
        if (callback) callback();
      });
    }
  };

  useEffect(() => {
    const shuffledDeck = shuffleDeck(initializeDeck());
    setDeck(shuffledDeck);

    // Limpiar todo al desmontar el componente
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(changeSoundTimerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying && !isPaused) {
      // Programar el próximo cambio de carta
      timerRef.current = setTimeout(() => {
        drawNextCard();
      }, time * 1000);

      // Programar la precarga de la siguiente imagen
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
    // Limpiar temporizadores
    clearTimeout(timerRef.current);
    clearTimeout(changeSoundTimerRef.current);

    const shuffledDeck = shuffleDeck(initializeDeck());
    setDeck(shuffledDeck);
    setIsPlaying(true);
    setIsPaused(false);
    setPastCards([]);
    setPastCardsAll([]);
    setGameOver(false);
    setCountdown(time);

    // Secuencia de inicio: Barajar -> Mujer Apertura -> Iniciar juego
    playAudioImmediate("/sounds/sounds/0. barajar.mp3", () => {
      if (!isReset && time >= 4) {
        playAudioImmediate(`/sounds/mujer/1. mujer apertura.mp3`);
      }
    });
  };

  const drawNextCard = () => {
    // Cancelar cualquier temporizador pendiente
    clearTimeout(timerRef.current);

    if (deck.length > 0) {
      const newCard = deck.pop();

      // Actualización visual INMEDIATA
      setCurrentCard(newCard);
      setDeck([...deck]);
      setIsImageLoaded(false);
      setDisplayedCard(newCard);
      setPastCards((prev) => [newCard, ...prev].slice(0, isMobile ? CARD_SHOW_TOP_MOBILE : CARD_SHOW_TOP_DESKTOP));
      setPastCardsAll((prev) => [newCard, ...prev]);
      setCountdown(time);

      // Reproducir sonido inmediatamente (corta el anterior)
      // Primero el "cambio de carta" (opcional, si es muy rápido puede ser molesto, pero lo mantenemos)
      // playAudioImmediate("/sounds/sounds/0. cambio carta.mp3");

      // NOTA: Para que sea más fluido, reproducimos DIRECTAMENTE la carta
      // Si el usuario quiere el sonido de "cambio", podemos descomentar arriba,
      // pero eso retrasaría la voz de la carta.
      // Vamos a reproducir la voz de la carta directamente para máxima respuesta.
      playAudioImmediate(`/sounds/${activeVoice}/${newCard}. ${activeVoice}.mp3`);
    } else {
      setIsPlaying(false);
      setGameOver(true);
    }
  };

  const playSound = (soundName) => {
    playAudioImmediate(`/sounds/sounds/${soundName}.mp3`);
  };

  const togglePlay = () => {
    setIsPaused(!isPaused);
    playSound(isPaused ? "0. play" : "0. pause");
  };

  const handleVoiceChange = (voice) => {
    setActiveVoice(voice);
  };

  const stopGame = () => {
    if (window.confirm("¿Estás seguro de que quieres detener el juego? Esto reiniciará todo.")) {
      setIsPlaying(false);
      setIsPaused(false);
      setIsPaused(false);
      clearTimeout(timerRef.current);
      clearTimeout(changeSoundTimerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setDeck(shuffleDeck(initializeDeck()));
      setPastCards([]);
      setPastCardsAll([]);
      setCurrentCard(1);
      setIsImageLoaded(false);
      setNextImageUrl("");
      setGameOver(false);
    }
  };

  return (
    <div className="loteria-container loteria-modern">
      {isLoading && <LoadingScreen assets={assetsToLoad} onComplete={() => setIsLoading(false)} />}
      {/* Fondo dinámico separado para evitar conflictos de layout */}
      <div className="loteria-bg-wrapper">
        <div
          className="loteria-dynamic-bg"
          style={{
            backgroundImage: displayedCard ? `url(/${typeCard}WEBP/${displayedCard}.webp)` : "linear-gradient(135deg, #2b2f3a 0%, #3b4858 100%);",
          }}
        />
      </div>

      <TopPanel pastCards={pastCards} typeCard={typeCard} displayedCard={displayedCard} pastCardsAll={pastCardsAll} />
      {isMobile && <h1 className="title">Lotería Mexicana</h1>}
      {pastCardsAll.length > 0 && (
        <div style={{ textAlign: "center", fontSize: 15, position: "absolute", left: "0", top: "10px", right: "0", zIndex: 10 }}>
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

            {/* Contador como componente independiente */}
            {isPlaying && !isPaused && <CountdownTimer countdown={countdown} totalTime={time} />}
          </div>
          <p></p>
          <p></p>

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
        <button
          style={{
            padding: "0.7rem 1.5rem",
            backgroundColor: "#a33",
            color: "white",
            border: "none",
            borderRadius: "30px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
            transition: "all 0.3s",
          }}
          onClick={() => setIsModalOpen(true)}
        >
          Generador de Cartones
        </button>
      </div>
      <LoteriaCardGenerator isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <p></p>
      <p></p>
    </div>
  );
};

export default Loteria;
