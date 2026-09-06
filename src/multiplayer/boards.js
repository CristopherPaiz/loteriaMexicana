/* ============================================================
   Construcción de cartones deterministas.

   Un cartón se calcula, nunca se transmite. Con el código de partida, el
   código del jugador y el número de cartón, cualquier dispositivo llega al
   mismo resultado: por eso no hace falta servidor.

   El código de partida NO decide el orden en que salen las cartas. Si lo
   hiciera, cualquiera podría calcular la baraja entera por adelantado y saber
   de antemano si va a ganar. La semilla solo reparte cartones; el mazo se
   sigue barajando en vivo en el teléfono del anfitrión.
   ============================================================ */

import { pickUnique, randomFromSeed } from "./rng.js";
import { BOARD_SIZE } from "./modes.js";
import { MAX_BOARDS, MIN_BOARDS } from "./codes.js";

export const TOTAL_CARDS = 54;

// Los límites viven en codes.js porque el código de partida los codifica:
// aquí solo se reexportan para no tener dos verdades.
export const MIN_BOARDS_PER_PLAYER = MIN_BOARDS;
export const MAX_BOARDS_PER_PLAYER = MAX_BOARDS;

const ALL_CARDS = Array.from({ length: TOTAL_CARDS }, (_, i) => i + 1);

/**
 * Un cartón: 16 cartas distintas de las 54, en el orden en que se colocan
 * en la rejilla (índice 0 arriba-izquierda, 15 abajo-derecha).
 */
export const buildBoard = (gameCode, playerCode, boardIndex = 0) => {
  const random = randomFromSeed(`loteria:${gameCode}:${playerCode}:${boardIndex}`);
  return pickUnique(ALL_CARDS, BOARD_SIZE, random);
};

/** Los cartones de un jugador, tantos como haya decidido el anfitrión. */
export const buildPlayerBoards = (gameCode, playerCode, count = 1) => {
  const total = Math.min(Math.max(count, MIN_BOARDS_PER_PLAYER), MAX_BOARDS_PER_PLAYER);
  return Array.from({ length: total }, (_, index) => buildBoard(gameCode, playerCode, index));
};
