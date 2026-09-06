import { GAME_CODE_LENGTH, onlyDigits } from "./codes.js";

/**
 * Saca el código de partida de lo que traiga un QR.
 *
 * Acepta el enlace completo que genera el anfitrión y también un simple número
 * de seis dígitos, por si alguien pega el código en otro generador de QR.
 */
export const codeFromScan = (text) => {
  if (!text) return null;

  const fromLink = String(text).match(/jugador\/(\d{6})/);
  if (fromLink) return fromLink[1];

  const digits = onlyDigits(text);
  return digits.length === GAME_CODE_LENGTH ? digits : null;
};
