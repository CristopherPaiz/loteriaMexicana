import { useState, useEffect, useRef } from "react";
import TopPanel from "./components/TopPanel";
import MainPanel from "./components/MainPanel";
import RightPanel from "./components/RightPanel";
import MenuButton from "./components/MenuButton";
import LoteriaCardGenerator from "./components/LoteriaCardGenerator";
import CountdownTimer from "./components/CountdownTimer";
import LoadingScreen from "./components/LoadingScreen";
import GameModal from "./components/GameModal";
import "./Loteria.css";

const TIME_BETWEEN_CARDS = 5;
const INITIAL_CARD_STYLE = "HD"; // HD o SD
const CARD_LENGTH = 54;
const CARD_SHOW_TOP_MOBILE = 5;
const CARD_SHOW_TOP_DESKTOP = 10;
const PRELOAD_TIME = 1; // Tiempo en segundos para precargar la siguiente imagen
const isMobile = window.innerWidth <= 768;
const STORAGE_KEY = "loteria_game_state";

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

  // Refs para el temporizador preciso
  const startTimeRef = useRef(null);
  const remainingTimeRef = useRef(null);

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
  const [assetCache, setAssetCache] = useState({});
  const [volumeBoost, setVolumeBoost] = useState(1.0);
  const [dimLevel, setDimLevel] = useState(0.5);

  // Estados para modales
  // Estados para modales
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showResumeConfirm, setShowResumeConfirm] = useState(false);
  const [showVolumeWarning, setShowVolumeWarning] = useState(false);
  const [pendingVolume, setPendingVolume] = useState(null);
  const [savedGameState, setSavedGameState] = useState(null);

  const handleVolumeChangeRequest = (level) => {
    if (level > 1.0 && level > volumeBoost) {
      setPendingVolume(level);
      setShowVolumeWarning(true);
    } else {
      setVolumeBoost(level);
    }
  };

  const confirmVolumeChange = () => {
    if (pendingVolume) {
      setVolumeBoost(pendingVolume);
      setPendingVolume(null);
    }
    setShowVolumeWarning(false);
  };

  // Audio Context Refs
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);

  // Función auxiliar para generar lista de assets
  const generateAssets = (type) => {
    const images = Array.from({ length: CARD_LENGTH }, (_, i) => `/${type}WEBP/${i + 1}.webp`);
    const sounds = [
      "/sounds/sounds/0. barajar.mp3",
      "/sounds/sounds/0. cambio carta.mp3",
      "/sounds/sounds/0. play.mp3",
      "/sounds/sounds/0. pause.mp3",
      "/sounds/mujer/1. mujer apertura.mp3",
    ];
    // Agregar audios de voz (mujer por defecto)
    const voiceSounds = Array.from({ length: CARD_LENGTH }, (_, i) => `/sounds/mujer/${i + 1}. mujer.mp3`);

    return [...images, ...sounds, ...voiceSounds];
  };

  const [assetsToLoad, setAssetsToLoad] = useState(() => generateAssets(INITIAL_CARD_STYLE));

  useEffect(() => {
    // Actualizar assets si cambia el tipo de carta, pero no forzar recarga completa si ya inició
    setAssetsToLoad(generateAssets(typeCard));
  }, [typeCard]);

  // Cargar juego y configuraciones guardadas al inicio
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedSettings = localStorage.getItem("loteria_settings");

    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.volumeBoost) setVolumeBoost(parsedSettings.volumeBoost);
        if (parsedSettings.dimLevel !== undefined) setDimLevel(parsedSettings.dimLevel);
      } catch (e) {
        console.error("Error parsing settings:", e);
      }
    }

    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        // Solo ofrecer reanudar si el juego estaba en progreso y no terminó
        if (parsedState.isPlaying && !parsedState.gameOver && parsedState.deck.length > 0) {
          setSavedGameState(parsedState);
          setShowResumeConfirm(true);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.error("Error parsing saved game:", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Guardar configuraciones cuando cambian
  useEffect(() => {
    localStorage.setItem("loteria_settings", JSON.stringify({ volumeBoost, dimLevel }));
  }, [volumeBoost, dimLevel]);

  // Inicializar AudioContext
  useEffect(() => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
    // Actualizar ganancia
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volumeBoost;
    }
  }, [volumeBoost]);

  // Guardar estado del juego
  useEffect(() => {
    if (isPlaying && deck.length > 0) {
      const stateToSave = {
        currentCard,
        deck,
        pastCards,
        pastCardsAll,
        displayedCard,
        time,
        typeCard,
        isPlaying,
        isPaused: true, // Siempre guardar como pausado para que no arranque solo
        remainingTime: remainingTimeRef.current || time * 1000, // Guardar tiempo restante aproximado
        gameOver,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } else if (!isPlaying && !isLoading && !showResumeConfirm) {
      // Limpiar si el juego terminó o se detuvo manualmente (y no estamos en el modal de resume)
      // Pero cuidado de no borrarlo mientras decidimos si reanudar
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentCard, deck, pastCards, pastCardsAll, displayedCard, time, typeCard, isPlaying, gameOver, isLoading, showResumeConfirm]);

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
      // Resume AudioContext if suspended (browser policy)
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }

      // Desconectar nodo anterior si existe
      if (sourceNodeRef.current) {
        // sourceNodeRef.current.disconnect(); // No es estrictamente necesario si el elemento de audio cambia
      }

      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      // Usar blob URL si existe en caché, sino usar src original
      const audioSrc = assetCache[src] || src;
      audioRef.current.src = audioSrc;

      // Conectar elemento de audio al nodo de ganancia si no está conectado
      if (!sourceNodeRef.current && audioContextRef.current && gainNodeRef.current) {
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceNodeRef.current.connect(gainNodeRef.current);
      }

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
    // Solo inicializar deck si no estamos reanudando un juego
    if (!showResumeConfirm && !savedGameState) {
      const shuffledDeck = shuffleDeck(initializeDeck());
      setDeck(shuffledDeck);
    }

    // Limpiar todo al desmontar el componente
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(changeSoundTimerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying && !isPaused) {
      // Si no hay tiempo restante guardado, usar el tiempo completo
      const duration = remainingTimeRef.current !== null ? remainingTimeRef.current : time * 1000;

      startTimeRef.current = Date.now();

      // Programar el próximo cambio de carta
      timerRef.current = setTimeout(() => {
        remainingTimeRef.current = null; // Resetear tiempo restante al completar
        drawNextCard();
      }, duration);

      // Programar la precarga de la siguiente imagen (ajustado al tiempo restante)
      const preloadDelay = Math.max(0, duration - PRELOAD_TIME * 1000);
      const preloadTimer = setTimeout(() => {
        if (deck.length > 0) {
          const nextCardNumber = deck[deck.length - 1];
          preloadImage(nextCardNumber);
        }
      }, preloadDelay);

      return () => {
        clearTimeout(timerRef.current);
        clearTimeout(preloadTimer);
      };
    } else {
      // Al pausar, calcular y guardar el tiempo restante
      if (startTimeRef.current && isPlaying) {
        const elapsed = Date.now() - startTimeRef.current;
        const currentRemaining = (remainingTimeRef.current !== null ? remainingTimeRef.current : time * 1000) - elapsed;
        remainingTimeRef.current = Math.max(0, currentRemaining);
      }
      clearTimeout(timerRef.current);
    }
  }, [isPlaying, isPaused, currentCard, deck, time, typeCard]);

  useEffect(() => {
    let intervalId;
    if (isPlaying && !isPaused && countdown > 0) {
      // Sincronizar el countdown visual con el tiempo restante real si existe
      if (remainingTimeRef.current) {
        setCountdown(Math.ceil(remainingTimeRef.current / 1000));
      }

      intervalId = setInterval(() => {
        setCountdown((prev) => {
          const newVal = prev - 1;
          // Actualizar remainingTimeRef para mantener sincronía aproximada
          if (remainingTimeRef.current) {
            remainingTimeRef.current -= 1000;
          }
          return newVal;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, isPaused, countdown]);

  const preloadImage = (cardNumber) => {
    const imageUrl = `/${typeCard}WEBP/${cardNumber}.webp`;
    // Si ya tenemos el blob en caché, no necesitamos precargar con Image()
    if (assetCache[imageUrl]) {
      setNextImageUrl(assetCache[imageUrl]);
      setIsImageLoaded(true);
      return;
    }

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
    remainingTimeRef.current = null; // Resetear tiempo restante

    const shuffledDeck = shuffleDeck(initializeDeck());
    setDeck(shuffledDeck);
    setIsPlaying(true);
    setIsPaused(false);
    setPastCards([]);
    setPastCardsAll([]);
    setGameOver(false);
    setCountdown(time);
    setCurrentCard(1); // Reset visual to first card
    setDisplayedCard(null); // Reset background to gradient

    // Secuencia de inicio: Barajar -> Mujer Apertura -> Iniciar juego
    playAudioImmediate("/sounds/sounds/0. barajar.mp3", () => {
      if (!isReset && time >= 4) {
        playAudioImmediate(`/sounds/mujer/1. mujer apertura.mp3`);
      }
    });
  };

  const resumeSavedGame = () => {
    if (savedGameState) {
      setDeck(savedGameState.deck);
      setCurrentCard(savedGameState.currentCard);
      setPastCards(savedGameState.pastCards);
      setPastCardsAll(savedGameState.pastCardsAll);
      setDisplayedCard(savedGameState.displayedCard);
      setTime(savedGameState.time);
      setTypeCard(savedGameState.typeCard);
      setGameOver(savedGameState.gameOver);

      // Restaurar tiempo restante
      remainingTimeRef.current = savedGameState.remainingTime;
      setCountdown(Math.ceil(savedGameState.remainingTime / 1000));

      setIsPlaying(true);
      setIsPaused(true); // Reanudar en pausa para que el usuario decida cuándo seguir

      setShowResumeConfirm(false);
      setSavedGameState(null);
    }
  };

  const drawNextCard = () => {
    // Cancelar cualquier temporizador pendiente
    clearTimeout(timerRef.current);
    remainingTimeRef.current = null; // Resetear tiempo restante para la nueva carta

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
      playAudioImmediate(`/sounds/${activeVoice}/${newCard}. ${activeVoice}.mp3`);
    } else {
      setIsPlaying(false);
      setGameOver(true);
      localStorage.removeItem(STORAGE_KEY); // Limpiar guardado al terminar
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

  // Alerta de recarga de página
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isPlaying && !gameOver) {
        e.preventDefault();
        e.returnValue = ""; // Necesario para Chrome
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isPlaying, gameOver]);

  const requestStopGame = () => {
    setIsPaused(true); // Pausar el juego mientras se decide
    setShowStopConfirm(true);
  };

  const confirmStopGame = () => {
    setIsPlaying(false);
    setIsPaused(false);
    clearTimeout(timerRef.current);
    clearTimeout(changeSoundTimerRef.current);
    remainingTimeRef.current = null;

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
    localStorage.removeItem(STORAGE_KEY);
    setShowStopConfirm(false);
  };

  // Helper para obtener la URL de la imagen (caché o original)
  const getCardImageUrl = (cardNum) => {
    if (!cardNum) return "";
    const originalUrl = `/${typeCard}WEBP/${cardNum}.webp`;
    return assetCache[originalUrl] || originalUrl;
  };

  return (
    <div className="loteria-container loteria-modern">
      {isLoading && (
        <LoadingScreen
          assets={assetsToLoad}
          onComplete={(cache) => {
            setAssetCache(cache);
            setIsLoading(false);
          }}
        />
      )}
      {/* Fondo dinámico separado para evitar conflictos de layout */}
      <div className="loteria-bg-wrapper">
        <div
          className="loteria-dynamic-bg"
          style={{
            backgroundImage: displayedCard ? `url(${getCardImageUrl(displayedCard)})` : "linear-gradient(135deg, #2b2f3a 0%, #3b4858 100%);",
            opacity: dimLevel, // Aplicar nivel de dim
          }}
        />
      </div>

      <TopPanel
        pastCards={pastCards}
        typeCard={typeCard}
        displayedCard={displayedCard}
        pastCardsAll={pastCardsAll}
        getCardImageUrl={getCardImageUrl}
      />
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
              stopGame={requestStopGame}
              isPlaying={isPlaying}
              isPaused={isPaused}
              typeCard={typeCard}
              isImageLoaded={isImageLoaded}
              nextImageUrl={nextImageUrl}
              currentImageUrl={getCardImageUrl(currentCard)}
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
            volumeBoost={volumeBoost}
            onVolumeChangeRequest={handleVolumeChangeRequest}
            dimLevel={dimLevel}
            setDimLevel={setDimLevel}
            onOpenGenerator={() => {
              setShowMenu(false);
              setIsModalOpen(true);
            }}
          />
          {!showMenu && <MenuButton onClick={() => setShowMenu(!showMenu)} />}
        </>
      )}
      <audio ref={audioRef} />

      <LoteriaCardGenerator isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Modal de confirmación para detener juego */}
      <GameModal
        isOpen={showStopConfirm}
        title="¿Reiniciar Juego?"
        onConfirm={confirmStopGame}
        onCancel={() => setShowStopConfirm(false)}
        confirmText="Sí, reiniciar"
        cancelText="Cancelar"
      >
        <p>¿Estás seguro de que quieres detener el juego? Se perderá el progreso actual.</p>
      </GameModal>

      {/* Modal de confirmación para reanudar juego */}
      <GameModal
        isOpen={showResumeConfirm}
        title="Juego Encontrado"
        onConfirm={resumeSavedGame}
        onCancel={() => {
          setShowResumeConfirm(false);
          localStorage.removeItem(STORAGE_KEY);
          setSavedGameState(null);
        }}
        confirmText="Reanudar"
        cancelText="Nuevo Juego"
      >
        <p>Se encontró un juego previo incompleto.</p>
        {savedGameState && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "10px" }}>
            <p style={{ fontSize: "0.9rem", marginBottom: "10px" }}>Última carta:</p>
            <img
              src={getCardImageUrl(savedGameState.displayedCard)}
              alt="Última carta"
              style={{ width: "80px", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.3)" }}
            />
            <p style={{ fontSize: "0.8rem", marginTop: "10px", opacity: 0.7 }}>Cartas restantes: {savedGameState.deck.length}</p>
          </div>
        )}
      </GameModal>

      {/* Modal de advertencia de volumen */}
      <GameModal
        isOpen={showVolumeWarning}
        title="⚠️ Precaución"
        onConfirm={confirmVolumeChange}
        onCancel={() => setShowVolumeWarning(false)}
        confirmText="Entiendo, aumentar"
        cancelText="Cancelar"
      >
        <p style={{ color: "#ffcc80" }}>
          Aumentar el volumen por encima del 100% puede causar distorsión o ser perjudicial para tus oídos y altavoces.
        </p>
        <p>¿Estás seguro de que deseas continuar?</p>
      </GameModal>

      <p></p>
      <p></p>
    </div>
  );
};

export default Loteria;
