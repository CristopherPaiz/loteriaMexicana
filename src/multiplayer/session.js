/* ============================================================
   Rutas por hash y estado guardado del multijugador.

   Se usa el hash (#/jugador/...) a propósito: funciona en cualquier hosting
   estático, sobrevive a un refresco sin configurar reescrituras en el servidor
   y no añade ninguna dependencia de router.
   ============================================================ */

import { onlyDigits, GAME_CODE_LENGTH, PLAYER_CODE_LENGTH } from "./codes.js";
import { DEFAULT_MODE_ID, getMode } from "./modes.js";
import { MAX_BOARDS_PER_PLAYER, MIN_BOARDS_PER_PLAYER } from "./boards.js";

export const HOST_KEY = "loteria_mp_host";
export const PLAYER_KEY = "loteria_mp_player";

export const ROUTES = {
  host: "host",
  player: "player",
  help: "help",
};

const clampBoards = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return MIN_BOARDS_PER_PLAYER;
  return Math.min(Math.max(Math.round(number), MIN_BOARDS_PER_PLAYER), MAX_BOARDS_PER_PLAYER);
};

/**
 * Lee la ruta actual del hash.
 * #/                                      -> anfitrión
 * #/como-funciona                         -> explicación
 * #/jugador                               -> unirse escribiendo el código
 * #/jugador/<partida>/<cartones>/<modo>   -> unirse con todo prellenado (QR)
 */
export const parseRoute = (hash = window.location.hash) => {
  const segments = String(hash)
    .replace(/^#\/?/, "")
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);

  if (segments[0] === "como-funciona") return { name: ROUTES.help };

  if (segments[0] === "jugador") {
    return {
      name: ROUTES.player,
      gameCode: onlyDigits(segments[1] ?? "", GAME_CODE_LENGTH),
      boardsPerPlayer: segments[2] ? clampBoards(segments[2]) : null,
      modeId: segments[3] && getMode(segments[3]).id === segments[3] ? segments[3] : null,
    };
  }

  return { name: ROUTES.host };
};

export const goTo = (path) => {
  window.location.hash = path;
};

/** Enlace absoluto para el QR: lleva partida, cartones y modo ya resueltos. */
export const buildJoinUrl = ({ gameCode, boardsPerPlayer, modeId }) => {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/jugador/${gameCode}/${clampBoards(boardsPerPlayer)}/${modeId || DEFAULT_MODE_ID}`;
};

const readJson = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error(`No se pudo leer ${key}:`, error);
    return null;
  }
};

const writeJson = (key, value) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`No se pudo guardar ${key}:`, error);
  }
};

export const loadHostRoom = () => {
  const saved = readJson(HOST_KEY);
  if (!saved?.gameCode) return null;

  return {
    gameCode: onlyDigits(saved.gameCode, GAME_CODE_LENGTH),
    boardsPerPlayer: clampBoards(saved.boardsPerPlayer),
    modeId: getMode(saved.modeId).id,
  };
};

export const saveHostRoom = (room) => writeJson(HOST_KEY, room);

export const loadPlayerSession = () => {
  const saved = readJson(PLAYER_KEY);
  if (!saved?.gameCode || !saved?.playerCode) return null;

  return {
    gameCode: onlyDigits(saved.gameCode, GAME_CODE_LENGTH),
    playerCode: onlyDigits(saved.playerCode, PLAYER_CODE_LENGTH),
    boardsPerPlayer: clampBoards(saved.boardsPerPlayer),
    modeId: getMode(saved.modeId).id,
    // Las marcas se guardan por cartón: { "0": [3, 7, 11], "1": [...] }
    marks: saved.marks && typeof saved.marks === "object" ? saved.marks : {},
  };
};

export const savePlayerSession = (session) => writeJson(PLAYER_KEY, session);

export const clearPlayerSession = () => writeJson(PLAYER_KEY, null);
