/* ============================================================
   Códigos numéricos tipo OTP.

   El código de partida NO es solo una semilla: lleva dentro la configuración
   entera de la sala (cuántos cartones y qué modo). Es lo que hace imposible
   el desajuste más molesto —que el anfitrión reparta 3 cartones y un jugador
   se quede con 1—, porque el jugador ya no elige nada: teclea seis dígitos y
   su teléfono deduce el resto.

   También significa que cambiar cualquier ajuste obliga a un código nuevo:
   otra configuración es, por definición, otra sala.

       payload = semilla * 24 + modo * 3 + (cartones - 1)      (5 dígitos)
       código  = payload + dígito de control                   (6 dígitos)

   - Código de jugador: 5 dígitos, lo genera el propio teléfono del jugador.
     100.000 combinaciones dejan la probabilidad de que dos jugadores repitan
     cartón en torno al 0,2 % con 20 personas (paradoja del cumpleaños); con 3
     dígitos habría sido del 18 %, demasiado para un fallo tan silencioso.
   ============================================================ */

import { GAME_MODES } from "./modes.js";

export const GAME_CODE_LENGTH = 6; // 5 de payload + 1 de control
export const GAME_PAYLOAD_LENGTH = 5;
export const PLAYER_CODE_LENGTH = 5;

export const MIN_BOARDS = 1;
export const MAX_BOARDS = 3;

// Se reservan 8 huecos de modo aunque hoy solo se usen 6: así se pueden añadir
// dos modos más adelante sin que los códigos cambien de significado.
const MODE_SLOTS = 8;
const CONFIG_SLOTS = MODE_SLOTS * MAX_BOARDS; // 24 combinaciones
const PAYLOAD_SPACE = 10 ** GAME_PAYLOAD_LENGTH; // 100.000
const SEED_SPACE = Math.floor(PAYLOAD_SPACE / CONFIG_SLOTS); // 4.166 salas por configuración

/** Solo deja dígitos y recorta al largo pedido. */
export const onlyDigits = (value, maxLength = Infinity) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, maxLength);

/**
 * Dígito de control con pesos alternos 3/1 (mismo esquema que EAN/GTIN).
 * Detecta todo error de un solo dígito y casi toda transposición vecina.
 */
export const checkDigit = (payloadDigits) => {
  const sum = String(payloadDigits)
    .split("")
    .reduce((total, char, index) => total + Number(char) * (index % 2 === 0 ? 3 : 1), 0);

  return (10 - (sum % 10)) % 10;
};

/** Números aleatorios de calidad criptográfica cuando el navegador los ofrece. */
const randomBelow = (limit) => {
  const cryptoApi = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (cryptoApi?.getRandomValues) {
    const buffer = new Uint32Array(1);
    // Se descarta el sobrante del último bloque para no sesgar los valores bajos.
    const ceiling = Math.floor(0x100000000 / limit) * limit;

    do {
      cryptoApi.getRandomValues(buffer);
    } while (buffer[0] >= ceiling);

    return buffer[0] % limit;
  }

  return Math.floor(Math.random() * limit);
};

const clampBoards = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return MIN_BOARDS;
  return Math.min(Math.max(Math.round(number), MIN_BOARDS), MAX_BOARDS);
};

const modeIndexOf = (modeId) => {
  const index = GAME_MODES.findIndex((mode) => mode.id === modeId);
  return index === -1 ? 0 : index;
};

/**
 * Crea el código de una sala con su configuración dentro.
 * Cada llamada estrena semilla, así que reconfigurar siempre da un código nuevo.
 */
export const createGameCode = ({ boardsPerPlayer = MIN_BOARDS, modeId = GAME_MODES[0].id } = {}) => {
  const config = modeIndexOf(modeId) * MAX_BOARDS + (clampBoards(boardsPerPlayer) - 1);
  const payload = randomBelow(SEED_SPACE) * CONFIG_SLOTS + config;
  const digits = String(payload).padStart(GAME_PAYLOAD_LENGTH, "0");

  return `${digits}${checkDigit(digits)}`;
};

/**
 * Lee un código de partida. Devuelve null si no es válido, ya sea porque el
 * dígito de control no cuadra (un dedazo al teclear) o porque apunta a un hueco
 * de modo todavía sin usar.
 */
export const decodeGameCode = (code) => {
  const digits = onlyDigits(code);
  if (digits.length !== GAME_CODE_LENGTH) return null;

  const payloadDigits = digits.slice(0, GAME_PAYLOAD_LENGTH);
  if (Number(digits[GAME_CODE_LENGTH - 1]) !== checkDigit(payloadDigits)) return null;

  const config = Number(payloadDigits) % CONFIG_SLOTS;
  const modeIndex = Math.floor(config / MAX_BOARDS);
  if (modeIndex >= GAME_MODES.length) return null;

  return {
    gameCode: digits,
    boardsPerPlayer: (config % MAX_BOARDS) + 1,
    modeId: GAME_MODES[modeIndex].id,
  };
};

export const isValidGameCode = (code) => decodeGameCode(code) !== null;

/** Código de jugador: 5 dígitos sin control (el anfitrión ve el cartón y lo compara). */
export const createPlayerCode = () => String(randomBelow(10 ** PLAYER_CODE_LENGTH)).padStart(PLAYER_CODE_LENGTH, "0");

export const isValidPlayerCode = (code) => onlyDigits(code).length === PLAYER_CODE_LENGTH;

/** Agrupa para leerlo en voz alta: 482173 -> "482 173", 48217 -> "482 17". */
export const formatCode = (code) => {
  const digits = onlyDigits(code);
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
};
