/* ============================================================
   Códigos numéricos tipo OTP.

   - Código de partida: 6 dígitos. Los 5 primeros son la semilla y el sexto es
     un dígito de control. Sirve para que un jugador que teclea mal un número
     reciba un aviso en lugar de acabar, sin enterarse, en una partida distinta
     con cartones que no cuadran con nadie.
   - Código de jugador: 5 dígitos, lo genera el propio teléfono del jugador.
     100.000 combinaciones dejan la probabilidad de que dos jugadores repitan
     cartón en torno al 0,2 % con 20 personas (paradoja del cumpleaños); con 3
     dígitos habría sido del 18 %, demasiado para un fallo tan silencioso.
   ============================================================ */

export const GAME_CODE_LENGTH = 6; // 5 de semilla + 1 de control
export const GAME_SEED_LENGTH = 5;
export const PLAYER_CODE_LENGTH = 5;

/** Solo deja dígitos y recorta al largo pedido. */
export const onlyDigits = (value, maxLength = Infinity) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, maxLength);

/**
 * Dígito de control con pesos alternos 3/1 (mismo esquema que EAN/GTIN).
 * Detecta todo error de un solo dígito y casi toda transposición vecina.
 */
export const checkDigit = (seedDigits) => {
  const sum = String(seedDigits)
    .split("")
    .reduce((total, char, index) => total + Number(char) * (index % 2 === 0 ? 3 : 1), 0);

  return (10 - (sum % 10)) % 10;
};

/** Números aleatorios de calidad criptográfica cuando el navegador los ofrece. */
const randomDigit = () => {
  const cryptoApi = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (cryptoApi?.getRandomValues) {
    const buffer = new Uint8Array(1);

    // Descartamos 250-255 para no sesgar los dígitos 0-5 al hacer el módulo.
    do {
      cryptoApi.getRandomValues(buffer);
    } while (buffer[0] >= 250);

    return buffer[0] % 10;
  }

  return Math.floor(Math.random() * 10);
};

const randomDigits = (length) =>
  Array.from({ length }, () => randomDigit()).join("");

/** Código de partida completo: semilla aleatoria + dígito de control. */
export const createGameCode = () => {
  const seed = randomDigits(GAME_SEED_LENGTH);
  return `${seed}${checkDigit(seed)}`;
};

/** Código de jugador: 5 dígitos sin control (el anfitrión ve el cartón y lo compara). */
export const createPlayerCode = () => randomDigits(PLAYER_CODE_LENGTH);

/** ¿El código de partida tiene el largo correcto y el control cuadra? */
export const isValidGameCode = (code) => {
  const digits = onlyDigits(code);
  if (digits.length !== GAME_CODE_LENGTH) return false;

  const seed = digits.slice(0, GAME_SEED_LENGTH);
  return Number(digits[GAME_CODE_LENGTH - 1]) === checkDigit(seed);
};

export const isValidPlayerCode = (code) => onlyDigits(code).length === PLAYER_CODE_LENGTH;

/** Agrupa para leerlo en voz alta: 482173 -> "482 173", 48217 -> "482 17". */
export const formatCode = (code) => {
  const digits = onlyDigits(code);
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
};
