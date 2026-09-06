import { useState, useEffect, useRef, useCallback } from "react";
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
const MOBILE_BREAKPOINT = 768;
const STORAGE_KEY = "loteria_game_state";
const SETTINGS_KEY = "loteria_settings";
const VOICES = ["hombre", "mujer", "nino", "joven"];
const DEFAULT_VOICE = "mujer";

const cardImageUrls = (type) => Array.from({ length: CARD_LENGTH }, (_, i) => `/${type}WEBP/${i + 1}.webp`);
const voiceSoundUrls = (voice) => Array.from({ length: CARD_LENGTH }, (_, i) => `/sounds/${voice}/${i + 1}. ${voice}.mp3`);

const BASE_SOUNDS = [
  "/sounds/sounds/0. barajar.mp3",
  "/sounds/sounds/0. cambio carta.mp3",
  "/sounds/sounds/0. play.mp3",
  "/sounds/sounds/0. pause.mp3",
  `/sounds/${DEFAULT_VOICE}/1. ${DEFAULT_VOICE} apertura.mp3`,
];

// Assets mínimos para poder jugar: imágenes del estilo inicial + voz por defecto.
const generateAssets = (type) => [...cardImageUrls(type), ...BASE_SOUNDS, ...voiceSoundUrls(DEFAULT_VOICE)];

const Loteria = () => {
  const [currentCard, setCurrentCard] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [deck, setDeck] = useState([]);
  const [pastCards, setPastCards] = useState([]);
  const [pastCardsAll, setPastCardsAll] = useState([]);
  const [activeVoice, setActiveVoice] = useState(DEFAULT_VOICE);
  const [showMenu, setShowMenu] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // Temporizador basado en reloj de pared: una sola fuente de verdad.
  const deadlineRef = useRef(null); // timestamp en el que sale la próxima carta
  const remainingMsRef = useRef(null); // ms pendientes cuando el juego está pausado

  // Espejo del mazo para la lógica de timers (evita closures obsoletos y mutar el estado).
  const deckRef = useRef([]);

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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);

  // Espejo del caché para leerlo desde timers y para revocar los blobs al desmontar.
  const assetCacheRef = useRef({});

  // Estados para modales
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showResumeConfirm, setShowResumeConfirm] = useState(false);
  const [showVolumeWarning, setShowVolumeWarning] = useState(false);
  const [pendingVolume, setPendingVolume] = useState(null);
  const [savedGameState, setSavedGameState] = useState(null);

  // Audio Context Refs
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);

  const [assetsToLoad] = useState(() => generateAssets(INITIAL_CARD_STYLE));

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

  // Detectar cambios de tamaño / rotación en vez de congelar el valor al importar el módulo.
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  // Descarga en segundo plano los assets que no entraron en la precarga inicial
  // (otras voces, el otro estilo de cartas) y los guarda como blobs en el caché.
  const cacheAssets = useCallback(async (urls) => {
    const missing = urls.filter((url) => !assetCacheRef.current[url]);
    if (missing.length === 0) return;

    let added = false;
    for (const url of missing) {
      if (assetCacheRef.current[url]) continue;
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const blob = await response.blob();
        assetCacheRef.current[url] = URL.createObjectURL(blob);
        added = true;
      } catch (error) {
        console.error(`No se pudo cachear el asset: ${url}`, error);
      }
    }
    if (added) setAssetCache({ ...assetCacheRef.current });
  }, []);

  // Cargar juego y configuraciones guardadas al inicio
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);

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
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ volumeBoost, dimLevel }));
  }, [volumeBoost, dimLevel]);

  // Grafo de audio: se crea perezosamente en el primer gesto del usuario.
  // Nunca se cierra el AudioContext: createMediaElementSource() solo puede llamarse
  // una vez por elemento <audio>, así que un context cerrado dejaría el audio mudo
  // (p. ej. con el doble montaje de StrictMode en desarrollo). Se suspende y ya.
  const ensureAudioGraph = useCallback(() => {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor || !audioRef.current) return;

    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new AudioContextCtor();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.gain.value = volumeBoost;
        gainNodeRef.current.connect(audioContextRef.current.destination);
      } catch (error) {
        console.error("No se pudo crear el AudioContext:", error);
        audioContextRef.current = null;
        return;
      }
    }

    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch(() => {});
    }

    if (!sourceNodeRef.current && gainNodeRef.current) {
      try {
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceNodeRef.current.connect(gainNodeRef.current);
      } catch (error) {
        // El elemento ya estaba enrutado por otro source: se reproduce sin boost.
        console.error("No se pudo enrutar el audio por el AudioContext:", error);
      }
    }
  }, [volumeBoost]);

  useEffect(() => {
    if (gainNodeRef.current) gainNodeRef.current.gain.value = volumeBoost;
  }, [volumeBoost]);

  const shuffleDeck = useCallback((deckToShuffle) => {
    const shuffled = [...deckToShuffle];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const initializeDeck = useCallback(() => Array.from({ length: CARD_LENGTH }, (_, i) => i + 1), []);

  const applyDeck = useCallback((nextDeck) => {
    deckRef.current = nextDeck;
    setDeck(nextDeck);
  }, []);

  // Reproduce audio inmediatamente, cortando el anterior.
  const playAudioImmediate = useCallback(
    (src, callback) => {
      if (!audioRef.current) return;
      ensureAudioGraph();

      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = assetCacheRef.current[src] || src;

      const handleEnded = () => {
        audioRef.current?.removeEventListener("ended", handleEnded);
        if (callback) callback();
      };
      audioRef.current.addEventListener("ended", handleEnded);

      audioRef.current.play().catch((err) => {
        console.error("Error al reproducir audio:", err);
        audioRef.current?.removeEventListener("ended", handleEnded);
        // Si falla, ejecutamos el callback de todos modos para no detener la lógica
        if (callback) callback();
      });
    },
    [ensureAudioGraph]
  );

  useEffect(() => {
    // Solo inicializar deck si no estamos reanudando un juego
    if (!showResumeConfirm && !savedGameState) {
      applyDeck(shuffleDeck(initializeDeck()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Liberar los blobs del caché al desmontar (se crea uno por asset precargado).
  useEffect(() => {
    const cache = assetCacheRef.current;
    const audioEl = audioRef.current;
    return () => {
      clearTimeout(timerRef.current);
      if (audioEl) {
        audioEl.pause();
        audioEl.removeAttribute("src");
      }
      Object.values(cache).forEach((blobUrl) => URL.revokeObjectURL(blobUrl));
      audioContextRef.current?.suspend?.().catch(() => {});
    };
  }, []);

  const preloadImage = useCallback(
    (cardNumber) => {
      const imageUrl = `/${typeCard}WEBP/${cardNumber}.webp`;
      const cached = assetCacheRef.current[imageUrl];
      if (cached) {
        setNextImageUrl(cached);
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
    },
    [typeCard]
  );

  const drawNextCard = useCallback(() => {
    clearTimeout(timerRef.current);
    deadlineRef.current = null;
    remainingMsRef.current = null;

    const remaining = [...deckRef.current];
    if (remaining.length === 0) {
      setIsPlaying(false);
      setGameOver(true);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const newCard = remaining.pop();
    applyDeck(remaining);

    // Actualización visual INMEDIATA
    setCurrentCard(newCard);
    setIsImageLoaded(false);
    setDisplayedCard(newCard);
    setPastCards((prev) => [newCard, ...prev].slice(0, isMobile ? CARD_SHOW_TOP_MOBILE : CARD_SHOW_TOP_DESKTOP));
    setPastCardsAll((prev) => [newCard, ...prev]);
    setCountdown(time);

    // Reproducir sonido inmediatamente (corta el anterior)
    playAudioImmediate(`/sounds/${activeVoice}/${newCard}. ${activeVoice}.mp3`);
  }, [activeVoice, applyDeck, isMobile, playAudioImmediate, time]);

  // Programación de la siguiente carta + precarga de su imagen.
  useEffect(() => {
    if (!isPlaying || isPaused) return undefined;

    const duration = remainingMsRef.current ?? time * 1000;
    deadlineRef.current = Date.now() + duration;

    timerRef.current = setTimeout(drawNextCard, duration);

    const preloadTimer = setTimeout(() => {
      if (deckRef.current.length > 0) preloadImage(deckRef.current[deckRef.current.length - 1]);
    }, Math.max(0, duration - PRELOAD_TIME * 1000));

    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(preloadTimer);
      // Si el efecto se cancela sin haber sacado carta (pausa, cambio de voz…),
      // guardamos lo que quedaba para reanudar exactamente donde iba.
      if (deadlineRef.current) {
        remainingMsRef.current = Math.max(0, deadlineRef.current - Date.now());
        deadlineRef.current = null;
      }
    };
  }, [isPlaying, isPaused, currentCard, time, drawNextCard, preloadImage]);

  // Cuenta regresiva visual derivada del reloj de pared (sin descontar a mano).
  useEffect(() => {
    if (!isPlaying || isPaused) return undefined;

    const tick = () => {
      if (!deadlineRef.current) return;
      setCountdown(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
    };

    tick();
    const intervalId = setInterval(tick, 250);
    return () => clearInterval(intervalId);
  }, [isPlaying, isPaused, currentCard]);

  // Guardar estado del juego
  useEffect(() => {
    if (isPlaying && deck.length > 0) {
      const remainingTime = remainingMsRef.current ?? (deadlineRef.current ? Math.max(0, deadlineRef.current - Date.now()) : time * 1000);
      const stateToSave = {
        currentCard,
        deck,
        pastCards,
        pastCardsAll,
        displayedCard,
        time,
        typeCard,
        activeVoice,
        isPlaying,
        isPaused: true, // Siempre guardar como pausado para que no arranque solo
        remainingTime,
        gameOver,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } else if (!isPlaying && !isLoading && !showResumeConfirm) {
      // Limpiar si el juego terminó o se detuvo manualmente (y no estamos en el modal de resume)
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [
    currentCard,
    deck,
    pastCards,
    pastCardsAll,
    displayedCard,
    time,
    typeCard,
    activeVoice,
    isPlaying,
    gameOver,
    isLoading,
    showResumeConfirm,
  ]);

  // Cachear en segundo plano la voz activa (al inicio solo se precarga la de defecto).
  useEffect(() => {
    if (isLoading) return;
    cacheAssets(voiceSoundUrls(activeVoice));
  }, [activeVoice, cacheAssets, isLoading]);

  // Cachear en segundo plano el estilo de cartas seleccionado (HD ⇄ SD).
  useEffect(() => {
    if (isLoading) return;
    cacheAssets(cardImageUrls(typeCard));
  }, [typeCard, cacheAssets, isLoading]);

  const startGame = () => {
    clearTimeout(timerRef.current);
    deadlineRef.current = null;
    remainingMsRef.current = null;

    applyDeck(shuffleDeck(initializeDeck()));
    setIsPlaying(true);
    setIsPaused(false);
    setPastCards([]);
    setPastCardsAll([]);
    setGameOver(false);
    setCountdown(time);
    setCurrentCard(1); // Reset visual to first card
    setDisplayedCard(null); // Reset background to gradient

    // Secuencia de inicio: Barajar -> Apertura -> Iniciar juego
    playAudioImmediate("/sounds/sounds/0. barajar.mp3", () => {
      if (!isReset && time >= 4) {
        playAudioImmediate(`/sounds/${DEFAULT_VOICE}/1. ${DEFAULT_VOICE} apertura.mp3`);
      }
    });
  };

  const resumeSavedGame = () => {
    if (!savedGameState) return;

    applyDeck(savedGameState.deck);
    setCurrentCard(savedGameState.currentCard);
    setPastCards(savedGameState.pastCards);
    setPastCardsAll(savedGameState.pastCardsAll);
    setDisplayedCard(savedGameState.displayedCard);
    setTime(savedGameState.time);
    setTypeCard(savedGameState.typeCard);
    if (savedGameState.activeVoice) setActiveVoice(savedGameState.activeVoice);
    setGameOver(savedGameState.gameOver);

    // Restaurar tiempo restante
    remainingMsRef.current = savedGameState.remainingTime ?? savedGameState.time * 1000;
    deadlineRef.current = null;
    setCountdown(Math.ceil(remainingMsRef.current / 1000));

    setIsPlaying(true);
    setIsPaused(true); // Reanudar en pausa para que el usuario decida cuándo seguir

    setShowResumeConfirm(false);
    setSavedGameState(null);
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
    deadlineRef.current = null;
    remainingMsRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    applyDeck(shuffleDeck(initializeDeck()));
    setPastCards([]);
    setPastCardsAll([]);
    setCurrentCard(1);
    setIsImageLoaded(false);
    setNextImageUrl("");
    setDisplayedCard(null);
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
            // Mutamos el objeto en sitio: el cleanup de desmontaje guarda esta
            // misma referencia para revocar los blobs.
            Object.assign(assetCacheRef.current, cache);
            setAssetCache({ ...assetCacheRef.current });
            setIsLoading(false);
          }}
        />
      )}
      {/* Fondo dinámico separado para evitar conflictos de layout */}
      <div className="loteria-bg-wrapper">
        <div
          className="loteria-dynamic-bg"
          style={{
            backgroundImage: displayedCard ? `url(${getCardImageUrl(displayedCard)})` : "linear-gradient(135deg, #2b2f3a 0%, #3b4858 100%)",
            opacity: dimLevel, // Aplicar nivel de dim
          }}
        />
      </div>

      {/* Cabecera en flujo normal: título arriba, contador debajo y las
          minicartas al final. Nada se superpone. */}
      <header className="loteria-header">
        <h1 className="title">Lotería Mexicana</h1>
        {pastCardsAll.length > 0 && (
          <div className="loteria-progress-pill">
            {pastCardsAll.length} / {CARD_LENGTH} · quedan {deck.length}
          </div>
        )}
      </header>

      <TopPanel
        pastCards={pastCards}
        typeCard={typeCard}
        displayedCard={displayedCard}
        pastCardsAll={pastCardsAll}
        getCardImageUrl={getCardImageUrl}
      />
      {gameOver ? (
        <div className="game-over">
          <h2>Se han acabado todas las cartas</h2>
          <button
            className="lot-btn lot-btn--start"
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
          <div className="loteria-stage">
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

          <RightPanel
            showMenu={showMenu}
            voices={VOICES}
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
    </div>
  );
};

export default Loteria;
