/* ============================================================
   Comprobación del núcleo determinista del multijugador.

   Se ejecuta con:  npm run test:cartones

   No es un framework de tests: es un script que falla ruidosamente si alguna
   de las garantías que sostienen el juego sin servidor deja de cumplirse.
   ============================================================ */

import { buildBoard, buildPlayerBoards, TOTAL_CARDS } from "../src/multiplayer/boards.js";
import { BOARD_SIZE, GAME_MODES, checkBoard, maskToIndexes } from "../src/multiplayer/modes.js";
import { checkDigit, createGameCode, createPlayerCode, isValidGameCode, isValidPlayerCode, GAME_CODE_LENGTH, PLAYER_CODE_LENGTH } from "../src/multiplayer/codes.js";

let failures = 0;

const check = (name, condition, detail = "") => {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures++;
    console.log(`  FALLA ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

const section = (title) => console.log(`\n${title}`);

// ------------------------------------------------------------
section("Cartones: forma y contenido");

const sample = buildBoard("482173", "90412", 0);

check("tiene 16 cartas", sample.length === BOARD_SIZE, `tiene ${sample.length}`);
check("sin cartas repetidas", new Set(sample).size === BOARD_SIZE);
check(
  `todas entre 1 y ${TOTAL_CARDS}`,
  sample.every((card) => Number.isInteger(card) && card >= 1 && card <= TOTAL_CARDS)
);

// ------------------------------------------------------------
section("Determinismo: el mismo código da el mismo cartón");

check("misma semilla, mismo resultado", JSON.stringify(buildBoard("482173", "90412", 0)) === JSON.stringify(sample));
check("otro cartón del mismo jugador es distinto", JSON.stringify(buildBoard("482173", "90412", 1)) !== JSON.stringify(sample));
check("otro jugador recibe otro cartón", JSON.stringify(buildBoard("482173", "90413", 0)) !== JSON.stringify(sample));
check("otra partida recibe otro cartón", JSON.stringify(buildBoard("482174", "90412", 0)) !== JSON.stringify(sample));

// Valor fijo: si esto cambia, una partida a medias se rompe entre versiones.
console.log(`  info cartón de referencia 482173/90412/0 -> [${sample.join(", ")}]`);

// ------------------------------------------------------------
section("Reparto: 10.000 jugadores en la misma partida");

const seen = new Map();
let duplicates = 0;

for (let i = 0; i < 10000; i++) {
  const playerCode = String(i).padStart(PLAYER_CODE_LENGTH, "0");
  const key = buildBoard("482173", playerCode, 0).join(",");
  if (seen.has(key)) duplicates++;
  else seen.set(key, playerCode);
}

check("10.000 códigos dan 10.000 cartones distintos", duplicates === 0, `${duplicates} repetidos`);

// Reparto plano: ninguna carta debería aparecer mucho más que las demás.
const frequency = new Array(TOTAL_CARDS + 1).fill(0);
for (let i = 0; i < 20000; i++) {
  buildBoard("482173", String(i).padStart(PLAYER_CODE_LENGTH, "0"), 0).forEach((card) => {
    frequency[card]++;
  });
}

const counts = frequency.slice(1);
const expected = (20000 * BOARD_SIZE) / TOTAL_CARDS;
const worst = Math.max(...counts.map((count) => Math.abs(count - expected) / expected));

check("cada carta sale con frecuencia pareja (±5 %)", worst < 0.05, `desviación máxima ${(worst * 100).toFixed(2)} %`);

// ------------------------------------------------------------
section("Códigos");

check("el código de partida mide 6 dígitos", createGameCode().length === GAME_CODE_LENGTH);
check("el código de jugador mide 5 dígitos", createPlayerCode().length === PLAYER_CODE_LENGTH);

let generated = true;
for (let i = 0; i < 2000; i++) {
  if (!isValidGameCode(createGameCode())) generated = false;
  if (!isValidPlayerCode(createPlayerCode())) generated = false;
}
check("todo código generado se valida a sí mismo", generated);

// Un dígito de control solo sirve si detecta los errores típicos al teclear.
let singleDigitCaught = 0;
let singleDigitTotal = 0;
let transposedCaught = 0;
let transposedTotal = 0;

for (let i = 0; i < 2000; i++) {
  const code = createGameCode();

  for (let position = 0; position < GAME_CODE_LENGTH; position++) {
    for (let digit = 0; digit <= 9; digit++) {
      if (String(digit) === code[position]) continue;
      const broken = `${code.slice(0, position)}${digit}${code.slice(position + 1)}`;
      singleDigitTotal++;
      if (!isValidGameCode(broken)) singleDigitCaught++;
    }
  }

  for (let position = 0; position < GAME_CODE_LENGTH - 1; position++) {
    if (code[position] === code[position + 1]) continue;
    const swapped = `${code.slice(0, position)}${code[position + 1]}${code[position]}${code.slice(position + 2)}`;
    transposedTotal++;
    if (!isValidGameCode(swapped)) transposedCaught++;
  }
}

check("detecta el 100 % de los errores de un solo dígito", singleDigitCaught === singleDigitTotal, `${singleDigitCaught}/${singleDigitTotal}`);
check("detecta más del 85 % de las transposiciones vecinas", transposedCaught / transposedTotal > 0.85, `${((transposedCaught / transposedTotal) * 100).toFixed(1)} %`);
check("el dígito de control siempre es 0-9", Array.from({ length: 500 }, (_, i) => checkDigit(String(i).padStart(5, "0"))).every((digit) => digit >= 0 && digit <= 9));

// ------------------------------------------------------------
section("Modos de juego");

check("los identificadores no se repiten", new Set(GAME_MODES.map((mode) => mode.id)).size === GAME_MODES.length);

GAME_MODES.forEach((mode) => {
  const validMasks = mode.patterns.every((pattern) => {
    const indexes = maskToIndexes(pattern.mask);
    return indexes.length > 0 && indexes.every((index) => index >= 0 && index < BOARD_SIZE);
  });
  check(`«${mode.label}» tiene patrones válidos`, validMasks && mode.patterns.length > 0);
});

// ------------------------------------------------------------
section("Verificación de lotería");

const board = buildBoard("482173", "90412", 0);
const modeClasico = GAME_MODES.find((mode) => mode.id === "clasico");
const modeLinea = GAME_MODES.find((mode) => mode.id === "linea");
const modeEsquinas = GAME_MODES.find((mode) => mode.id === "esquinas");

check("cartón lleno con todas las cartas cantadas", checkBoard(board, new Set(board), modeClasico).won);
check("cartón lleno al que le falta una carta no gana", !checkBoard(board, new Set(board.slice(1)), modeClasico).won);

const firstRow = new Set(board.slice(0, 4));
const rowResult = checkBoard(board, firstRow, modeLinea);
check("una fila completa gana en modo Línea", rowResult.won, rowResult.pattern ?? "");
check("esa misma fila no basta para el cartón lleno", !checkBoard(board, firstRow, modeClasico).won);

const corners = new Set([board[0], board[3], board[12], board[15]]);
check("las cuatro esquinas ganan en su modo", checkBoard(board, corners, modeEsquinas).won);

const almost = checkBoard(board, new Set([board[0], board[3], board[12]]), modeEsquinas);
check("con tres esquinas avisa que falta una", !almost.won && almost.missingIndexes.length === 1, `faltan ${almost.missingIndexes.length}`);

// ------------------------------------------------------------
section("Varios cartones por jugador");

const boards = buildPlayerBoards("482173", "90412", 3);
check("devuelve 3 cartones", boards.length === 3);
check("los 3 cartones son distintos entre sí", new Set(boards.map((item) => item.join(","))).size === 3);
check("pedir 9 cartones se recorta al máximo permitido", buildPlayerBoards("482173", "90412", 9).length === 3);
check("pedir 0 cartones devuelve al menos 1", buildPlayerBoards("482173", "90412", 0).length === 1);

// ------------------------------------------------------------
console.log(`\n${failures === 0 ? "Todo correcto." : `${failures} comprobación(es) fallaron.`}`);
process.exit(failures === 0 ? 0 : 1);
