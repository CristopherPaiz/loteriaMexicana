/* ============================================================
   Registro del service worker y aviso de versión nueva.

   La versión nueva NO se activa sola: se queda esperando y la app pregunta.
   Si el gritón está a media partida, una recarga por sorpresa le tira el mazo;
   así decide él cuándo.
   ============================================================ */

let enEspera = null;
let relevoPedido = false;

/**
 * @param {() => void} alHaberActualizacion  se llama cuando hay una versión
 *   nueva instalada y esperando el relevo.
 */
export const registrarServiceWorker = (alHaberActualizacion) => {
  if (!("serviceWorker" in navigator)) return;

  // Solo se recarga si el relevo lo pidió el usuario. La primera instalación
  // también dispara controllerchange —el worker recién activado reclama la
  // página— y recargar ahí sería un parpadeo gratis nada más entrar.
  let recargando = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!relevoPedido || recargando) return;
    recargando = true;
    window.location.reload();
  });

  navigator.serviceWorker
    .register("/sw.js")
    .then((registro) => {
      let avisado = false;

      const avisar = (worker) => {
        // Se mira el controlador AHORA, no al registrar: en la primera visita
        // todavía es null, y guardarse esa foto dejaba el aviso desactivado
        // para el resto de la sesión. Si hay controlador, esto es un relevo;
        // si no, es la instalación inicial y no hay nada que anunciar.
        if (avisado || !navigator.serviceWorker.controller) return;
        avisado = true;
        enEspera = worker;
        alHaberActualizacion();
      };

      /**
       * `updatefound` puede dispararse ANTES de que register() resuelva, así
       * que engancharse solo a ese evento se pierde la actualización por los
       * pelos. Se mira también el estado en que llega el worker.
       */
      const vigilar = (worker) => {
        if (!worker) return;
        if (worker.state === "installed") {
          avisar(worker);
          return;
        }
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed") avisar(worker);
        });
      };

      // Ya instalada y esperando de una visita anterior.
      if (registro.waiting) avisar(registro.waiting);

      // Instalándose ahora mismo, quizá desde antes de llegar aquí.
      vigilar(registro.installing);

      registro.addEventListener("updatefound", () => vigilar(registro.installing));

      // Volver a la app es el momento natural para mirar si hay algo nuevo:
      // mucha gente la deja abierta días entre partida y partida.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") registro.update().catch(() => undefined);
      });
    })
    .catch((error) => {
      console.error("No se pudo registrar el service worker:", error);
    });
};

/** Dar el relevo a la versión nueva. La recarga llega por controllerchange. */
export const aplicarActualizacion = () => {
  if (!enEspera) return;
  relevoPedido = true;
  enEspera.postMessage({ type: "SKIP_WAITING" });
};
