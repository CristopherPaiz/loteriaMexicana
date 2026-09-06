/* ============================================================
   Generador pseudoaleatorio determinista.

   Toda la magia del multijugador sin servidor vive aquí: dos teléfonos que
   parten de la misma semilla producen exactamente la misma secuencia de
   números, así que el anfitrión puede reconstruir el cartón de cualquier
   jugador sin haberlo recibido nunca.

   Es importante que estas funciones NO cambien nunca de comportamiento: si se
   tocan, los cartones dejan de coincidir entre versiones de la app y una
   partida a medias se rompe.
   ============================================================ */

/**
 * Hash FNV-1a de 32 bits. Convierte una cadena en un entero sin signo.
 * Determinista y estable entre navegadores (solo usa aritmética de 32 bits).
 */
export const hashSeed = (text) => {
  let hash = 0x811c9dc5;
  const value = String(text);

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    // Multiplicación por el primo FNV (16777619) descompuesta en sumas de
    // desplazamientos: en JavaScript un producto directo perdería precisión.
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    hash >>>= 0;
  }

  return hash >>> 0;
};

/**
 * PRNG mulberry32: rápido, sin dependencias y de calidad más que suficiente
 * para repartir cartas. Devuelve una función que produce flotantes en [0, 1).
 */
export const mulberry32 = (seed) => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Toma `count` elementos distintos de `items` usando el generador dado.
 *
 * Fisher-Yates parcial: solo baraja las primeras `count` posiciones, así que
 * el coste es proporcional a lo que se necesita y no a la baraja entera.
 * No muta el array original.
 */
export const pickUnique = (items, count, random) => {
  const pool = [...items];
  const total = Math.min(count, pool.length);

  for (let i = 0; i < total; i++) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, total);
};

/** Atajo: crea el generador directamente desde una cadena semilla. */
export const randomFromSeed = (seedText) => mulberry32(hashSeed(seedText));
