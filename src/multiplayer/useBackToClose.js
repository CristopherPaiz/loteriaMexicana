import { useEffect, useRef } from "react";

/**
 * Hace que el botón "atrás" del teléfono cierre el modal en lugar de salirse
 * de la página.
 *
 * Al abrirse se mete una entrada de más en el historial. Si el usuario pulsa
 * atrás, el navegador la consume, se dispara `popstate` y se cierra el modal:
 * la página se queda donde estaba.
 *
 * La pila es la parte importante. Con modales apilados —la ayuda encima de la
 * sala, una confirmación encima de todo— cada uno registra su propio oyente y
 * un solo `popstate` los alcanzaría a todos, cerrándolos de golpe. Por eso el
 * evento lo atiende un único oyente compartido que solo avisa al de arriba.
 */
const stack = [];
let attached = false;

const handlePop = () => {
  const top = stack.pop();
  if (!top) return;

  top.popped = true;
  top.close();
};

const ensureListener = () => {
  if (attached) return;
  window.addEventListener("popstate", handlePop);
  attached = true;
};

export const useBackToClose = (isOpen, onClose) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return undefined;

    const entry = { popped: false, close: () => onCloseRef.current() };
    stack.push(entry);
    ensureListener();
    window.history.pushState({ lotModal: true }, "");

    return () => {
      // Si lo cerró el propio "atrás", la entrada ya se consumió.
      if (entry.popped) return;

      const index = stack.indexOf(entry);
      if (index !== -1) stack.splice(index, 1);

      // Cerrado por la X, por Escape o por un clic fuera: hay que retirar la
      // entrada a mano, o el siguiente "atrás" se gastaría sin hacer nada.
      window.history.back();
    };
  }, [isOpen]);
};

export default useBackToClose;
