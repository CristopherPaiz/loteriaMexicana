import { useEffect, useState } from "react";
import { FaDownload, FaClock } from "react-icons/fa";
import Loteria from "./Loteria";
import GameModal from "./components/GameModal";
import PlayerScreen from "./components/multiplayer/PlayerScreen";
import { goTo, parseRoute, ROUTES } from "./multiplayer/session";
import { aplicarActualizacion, registrarServiceWorker } from "./updates";

// Layout, botones y panel lateral viven en src/ui.css (importado en main.jsx).
//
// El enrutado va por hash a propósito: funciona en cualquier hosting estático,
// aguanta un refresco sin configurar nada en el servidor y no añade ninguna
// dependencia de router.
function App() {
  const [route, setRoute] = useState(() => parseRoute());
  const [hayVersionNueva, setHayVersionNueva] = useState(false);

  // El service worker solo en producción, para no estorbar al HMR de Vite.
  useEffect(() => {
    if (import.meta.env.PROD) registrarServiceWorker(() => setHayVersionNueva(true));
  }, []);

  useEffect(() => {
    const handleHashChange = () => setRoute(parseRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const aviso = (
    <GameModal
      isOpen={hayVersionNueva}
      title="Hay una versión nueva"
      onCancel={() => setHayVersionNueva(false)}
      choices={[
        {
          key: "actualizar",
          icon: <FaDownload />,
          title: "Actualizar ahora",
          hint: "Tarda un momento. Tu partida guardada no se pierde.",
          tone: "si",
          onSelect: aplicarActualizacion,
        },
        {
          key: "luego",
          icon: <FaClock />,
          title: "Ahora no",
          hint: "Se vuelve a avisar la próxima vez que abras el juego.",
          onSelect: () => setHayVersionNueva(false),
        },
      ]}
    />
  );

  // #/unirse es el inicio con el modal de entrada ya abierto: unirse no
  // merece una pantalla propia, es un campo y un botón.
  if (route.name === ROUTES.join)
    return (
      <>
        <Loteria openJoin />
        {aviso}
      </>
    );

  if (route.name === ROUTES.player) {
    return (
      <>
        <PlayerScreen route={route} onExit={() => goTo("/")} />
        {aviso}
      </>
    );
  }

  return (
    <>
      <Loteria />
      {aviso}
    </>
  );
}

export default App;
