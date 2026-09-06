import { useEffect, useRef } from "react";

/**
 * Cierre de modales: el botón "atrás" del teléfono y la tecla Escape.
 *
 * Al abrirse se mete una entrada de más en el historial. Si el usuario pulsa
 * atrás, el navegador la consume, se dispara `popstate` y se cierra el modal:
 * la página se queda donde estaba en lugar de salirse.
 *
 * Con modales apilados —la ayuda encima de la sala, una confirmación encima de
 * todo— hay tres trampas, y todas se esquivan con la misma pila:
 *
 * 1. Si cada modal escucha `popstate` por su cuenta, un solo "atrás" los
 *    alcanza a todos y los cierra de golpe.
 * 2. Lo mismo con Escape: los oyentes van en `document`, así que el evento
 *    llega a todos los modales abiertos a la vez.
 * 3. Cerrar el hijo con la X obliga a retirar su entrada con `history.back()`,
 *    y esa llamada dispara otro `popstate`... que cerraría al padre.
 *
 * De ahí que los dos eventos los atienda un único oyente compartido que solo
 * avisa al de arriba de la pila, y que se lleve la cuenta de los retrocesos
 * que provocamos nosotros para pasarlos por alto.
 */
const stack = [];
let attached = false;
let selfTriggeredBacks = 0;

const closeTop = () => {
  const top = stack[stack.length - 1];
  if (top) top.close();
};

const handlePop = () => {
  // Retroceso provocado por nuestro propio cierre: no cierra nada más.
  if (selfTriggeredBacks > 0) {
    selfTriggeredBacks -= 1;
    return;
  }

  const top = stack.pop();
  if (!top) return;

  top.popped = true;
  top.close();
};

const handleKeyDown = (event) => {
  if (event.key !== "Escape" || stack.length === 0) return;
  event.stopPropagation();
  closeTop();
};

const ensureListeners = () => {
  if (attached) return;
  window.addEventListener("popstate", handlePop);
  document.addEventListener("keydown", handleKeyDown);
  attached = true;
};

export const useModalDismiss = (isOpen, onClose) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return undefined;

    const entry = { popped: false, close: () => onCloseRef.current() };
    stack.push(entry);
    ensureListeners();
    window.history.pushState({ lotModal: true }, "");

    return () => {
      // Si lo cerró el propio "atrás", la entrada ya se consumió.
      if (entry.popped) return;

      const index = stack.indexOf(entry);
      if (index !== -1) stack.splice(index, 1);

      // Si la app navegó mientras el modal se cerraba, nuestra entrada ya no
      // es la de arriba y retroceder desharía la navegación: el jugador se
      // quedaba fuera de su cartón justo después de escanear el QR.
      if (!window.history.state?.lotModal) return;

      // Cerrado por la X, por Escape o por un clic fuera: hay que retirar la
      // entrada a mano, o el siguiente "atrás" se gastaría sin hacer nada.
      selfTriggeredBacks += 1;
      window.history.back();
    };
  }, [isOpen]);
};

export default useModalDismiss;
