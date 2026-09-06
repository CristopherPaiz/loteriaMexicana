import { useEffect, useState } from "react";
import Loteria from "./Loteria";
import PlayerScreen from "./components/multiplayer/PlayerScreen";
import HowItWorks from "./components/multiplayer/HowItWorks";
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

  // Volver al paso anterior si lo hay; si se entró directo por enlace, al inicio.
  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else goTo("/");
  };

  if (route.name === ROUTES.help) return <HowItWorks onBack={goBack} />;

  if (route.name === ROUTES.player) {
    return <PlayerScreen route={route} onExit={() => goTo("/")} onOpenHelp={() => goTo("/como-funciona")} />;
  }

  return <Loteria />;
}

export default App;
