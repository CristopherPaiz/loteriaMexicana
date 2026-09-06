/* ============================================================
   Modos de juego.

   Un cartón es una rejilla 4x4; cada casilla tiene un índice 0-15 calculado
   como fila * 4 + columna. Un patrón de victoria es una máscara de 16 bits
   sobre esa rejilla, y un modo no es más que un nombre, la lista de patrones
   que acepta y (opcionalmente) el ritmo al que conviene cantar.

   Añadir un modo nuevo es añadir una entrada a GAME_MODES: nada más del
   sistema necesita enterarse.
   ============================================================ */

export const BOARD_ROWS = 4;
export const BOARD_COLUMNS = 4;
export const BOARD_SIZE = BOARD_ROWS * BOARD_COLUMNS;

/** Convierte una lista de índices en una máscara de bits. */
const mask = (indexes) => indexes.reduce((acc, index) => acc | (1 << index), 0);

const FULL = mask(Array.from({ length: BOARD_SIZE }, (_, i) => i));

const ROWS = Array.from({ length: BOARD_ROWS }, (_, row) => mask(Array.from({ length: BOARD_COLUMNS }, (_, col) => row * BOARD_COLUMNS + col)));

const COLUMNS = Array.from({ length: BOARD_COLUMNS }, (_, col) => mask(Array.from({ length: BOARD_ROWS }, (_, row) => row * BOARD_COLUMNS + col)));

const DIAGONALS = [mask([0, 5, 10, 15]), mask([3, 6, 9, 12])];

const CORNERS = mask([0, 3, 12, 15]);

const CENTER = mask([5, 6, 9, 10]);

// Aceptamos la L en sus cuatro giros: la forma se reconoce igual y evita
// discusiones en la mesa sobre "hacia qué lado" iba.
const LETTER_L = [
  mask([0, 4, 8, 12, 13, 14, 15]), // columna izquierda + fila inferior
  mask([0, 1, 2, 3, 4, 8, 12]), // fila superior + columna izquierda
  mask([0, 1, 2, 3, 7, 11, 15]), // fila superior + columna derecha
  mask([3, 7, 11, 15, 12, 13, 14]), // columna derecha + fila inferior
];

const LINES = [...ROWS, ...COLUMNS, ...DIAGONALS];

export const GAME_MODES = [
  {
    id: "clasico",
    label: "Clásico",
    short: "Cartón lleno",
    description: "Gana quien complete las 16 cartas del cartón.",
    patterns: [{ name: "Cartón lleno", mask: FULL }],
  },
  {
    id: "linea",
    label: "Línea",
    short: "Fila, columna o diagonal",
    description: "Gana la primera línea completa: cualquier fila, columna o diagonal.",
    patterns: [
      ...ROWS.map((value, i) => ({ name: `Fila ${i + 1}`, mask: value })),
      ...COLUMNS.map((value, i) => ({ name: `Columna ${i + 1}`, mask: value })),
      { name: "Diagonal ＼", mask: DIAGONALS[0] },
      { name: "Diagonal ／", mask: DIAGONALS[1] },
    ],
  },
  {
    id: "esquinas",
    label: "Cuatro esquinas",
    short: "Las 4 puntas",
    description: "Gana quien marque las cuatro esquinas del cartón.",
    patterns: [{ name: "Cuatro esquinas", mask: CORNERS }],
  },
  {
    id: "centro",
    label: "Centro",
    short: "Cuadro central",
    description: "Gana quien complete el cuadro de 2×2 del centro.",
    patterns: [{ name: "Cuadro central", mask: CENTER }],
  },
  {
    id: "ele",
    label: "Letra L",
    short: "Una L completa",
    description: "Gana quien forme una L: un lado entero más la fila del extremo. Vale en cualquiera de sus cuatro giros.",
    patterns: LETTER_L.map((value, i) => ({ name: `L (giro ${i + 1})`, mask: value })),
  },
  {
    id: "express",
    label: "Express",
    short: "Primero en completar 4",
    description: "Partida rápida: gana el primero que junte cuatro cartas en línea, en las esquinas o en el centro. Se canta cada 3 segundos.",
    time: 3,
    patterns: [
      ...LINES.map((value, i) => ({ name: `Línea ${i + 1}`, mask: value })),
      { name: "Cuatro esquinas", mask: CORNERS },
      { name: "Cuadro central", mask: CENTER },
    ],
  },
];

export const DEFAULT_MODE_ID = "clasico";

export const getMode = (modeId) => GAME_MODES.find((mode) => mode.id === modeId) ?? GAME_MODES.find((mode) => mode.id === DEFAULT_MODE_ID);

/** Índices de la rejilla que cubre una máscara. */
export const maskToIndexes = (value) => {
  const indexes = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (value & (1 << i)) indexes.push(i);
  }
  return indexes;
};

const countBits = (value) => maskToIndexes(value).length;

/**
 * Comprueba un cartón contra las cartas que realmente han salido.
 *
 * Ojo: se verifica contra el mazo cantado, no contra los frijoles que el
 * jugador puso. Poner el frijol sigue siendo cosa suya —y olvidarse es parte
 * del juego—, pero cuando alguien canta lotería lo que se juzga es si esas
 * cartas salieron de verdad.
 *
 * @param {number[]} board  16 números de carta.
 * @param {Set<number>} drawn  cartas ya cantadas.
 * @param {object} mode  modo de juego (de GAME_MODES).
 * @returns {{won: boolean, pattern: string|null, mask: number, missingIndexes: number[]}}
 */
export const checkBoard = (board, drawn, mode) => {
  let hits = 0;
  for (let i = 0; i < board.length; i++) {
    if (drawn.has(board[i])) hits |= 1 << i;
  }

  let best = null;

  for (const pattern of mode.patterns) {
    const missing = pattern.mask & ~hits;

    if (missing === 0) {
      return { won: true, pattern: pattern.name, mask: pattern.mask, missingIndexes: [] };
    }

    const pending = countBits(missing);
    // Guardamos el patrón al que menos le falta para poder decirle al
    // anfitrión "te faltaban dos" en lugar de un simple "no".
    if (!best || pending < best.pending) {
      best = { pending, pattern: pattern.name, mask: pattern.mask, missing };
    }
  }

  return {
    won: false,
    pattern: best?.pattern ?? null,
    mask: best?.mask ?? 0,
    missingIndexes: best ? maskToIndexes(best.missing) : [],
  };
};

/** Casillas marcadas de un cartón según las cartas cantadas. */
export const markedIndexes = (board, drawn) => board.reduce((acc, card, index) => (drawn.has(card) ? [...acc, index] : acc), []);
