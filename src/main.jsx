import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./ui.css";
import "./mp.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Los modales pesados (generador de cartones, QR) se cargan con lazy() para que
// no estorben en el arranque, pero esta app se juega offline: si nadie los abre
// mientras hay red, el service worker nunca llega a guardarlos y en la mesa —sin
// datos— fallarían. Se piden en tiempo muerto: fuera del camino crítico, pero ya
// en caché antes de que hagan falta.
const prefetchLazyChunks = () => {
  import("./components/LoteriaCardGenerator.jsx");
  import("./components/multiplayer/QrCode.jsx");
  import("./components/multiplayer/QrScanner.jsx");
};

if (import.meta.env.PROD) {
  if ("requestIdleCallback" in window) window.requestIdleCallback(prefetchLazyChunks, { timeout: 10000 });
  else setTimeout(prefetchLazyChunks, 4000);
}

// Service worker: solo en producción, para no interferir con el HMR de Vite.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("No se pudo registrar el service worker:", error);
    });
  });
}
