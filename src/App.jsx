import { useEffect, useState } from "react";
import Loteria from "./Loteria";
import PlayerScreen from "./components/multiplayer/PlayerScreen";
import { goTo, parseRoute, ROUTES } from "./multiplayer/session";

// Layout, botones y panel lateral viven en src/ui.css (importado en main.jsx).
//
// El enrutado va por hash a propósito: funciona en cualquier hosting estático,
// aguanta un refresco sin configurar nada en el servidor y no añade ninguna
// dependencia de router.
function App() {
  const [route, setRoute] = useState(() => parseRoute());

  useEffect(() => {
    const handleHashChange = () => setRoute(parseRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // #/unirse es el inicio con el modal de entrada ya abierto: unirse no
  // merece una pantalla propia, es un campo y un botón.
  if (route.name === ROUTES.join) return <Loteria openJoin />;

  if (route.name === ROUTES.player) {
    return <PlayerScreen route={route} onExit={() => goTo("/")} />;
  }

  return <Loteria />;
}

export default App;
