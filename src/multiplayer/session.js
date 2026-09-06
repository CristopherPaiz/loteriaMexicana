/* ============================================================
   Rutas por hash y estado guardado del multijugador.

   Se usa el hash (#/jugador/...) a propósito: funciona en cualquier hosting
   estático, sobrevive a un refresco sin configurar reescrituras en el servidor
   y no añade ninguna dependencia de router.

   La ruta del jugador solo lleva el código. Los cartones y el modo salen de
   descifrarlo, nunca de la URL ni de lo que el jugador escoja: así el QR y el
   código dictado a viva voz llevan exactamente a la misma sala.
   ============================================================ */

import { decodeGameCode, GAME_CODE_LENGTH, onlyDigits, PLAYER_CODE_LENGTH } from "./codes.js";
import { isMarkerKind } from "./markers.js";

export const HOST_KEY = "loteria_mp_host";
export const PLAYER_KEY = "loteria_mp_player";

export const ROUTES = {
  host: "host",
  player: "player",
  help: "help",
};

/**
 * Lee la ruta actual del hash.
 * #/                      -> anfitrión
 * #/como-funciona         -> explicación
 * #/jugador               -> unirse escribiendo el código
 * #/jugador/<código>      -> unirse directo (QR)
 */
export const parseRoute = (hash = window.location.hash) => {
  const segments = String(hash)
    .replace(/^#\/?/, "")
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);

  if (segments[0] === "como-funciona") return { name: ROUTES.help };

  if (segments[0] === "jugador") {
    return { name: ROUTES.player, gameCode: onlyDigits(segments[1] ?? "", GAME_CODE_LENGTH) };
  }

  return { name: ROUTES.host };
};

export const goTo = (path) => {
  window.location.hash = path;
};

/** Enlace absoluto para el QR. El código ya lleva cartones y modo dentro. */
export const buildJoinUrl = (gameCode) => {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/jugador/${onlyDigits(gameCode, GAME_CODE_LENGTH)}`;
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

/**
 * Sala del anfitrión. Solo se guarda el código: cartones y modo se descifran
 * de él, así que no pueden quedar desincronizados con lo que ven los jugadores.
 */
export const loadHostRoom = () => decodeGameCode(readJson(HOST_KEY)?.gameCode);

export const saveHostRoom = (room) => writeJson(HOST_KEY, room ? { gameCode: room.gameCode } : null);

export const loadPlayerSession = () => {
  const saved = readJson(PLAYER_KEY);
  const room = decodeGameCode(saved?.gameCode);
  if (!room || !saved?.playerCode) return null;

  return {
    ...room,
    playerCode: onlyDigits(saved.playerCode, PLAYER_CODE_LENGTH),
    // null hasta que el jugador escoge con qué marca: es lo que dispara la
    // pantalla de elección al recibir el cartón.
    marker: isMarkerKind(saved.marker) ? saved.marker : null,
    // Las marcas se guardan por cartón: { "0": [3, 7, 11], "1": [...] }
    marks: saved.marks && typeof saved.marks === "object" ? saved.marks : {},
  };
};

export const savePlayerSession = (session) =>
  writeJson(PLAYER_KEY, {
    gameCode: session.gameCode,
    playerCode: session.playerCode,
    marker: session.marker,
    marks: session.marks,
  });

export const clearPlayerSession = () => writeJson(PLAYER_KEY, null);
