import { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { FaQuestionCircle, FaQrcode } from "react-icons/fa";
import { decodeGameCode, GAME_CODE_LENGTH, onlyDigits } from "../../multiplayer/codes";
import { joinRoom } from "../../multiplayer/session";
import QrScanner from "./QrScanner";

/**
 * Entrar a una partida: un campo y un botón.
 *
 * El jugador no configura nada —los cartones y el modo viajan dentro del
 * código—, así que esto no necesita ser una pantalla propia. Vive dentro del
 * modal de multijugador y, en cuanto entra, se va a su cartón.
 */
const JoinForm = ({ onJoined, onOpenHelp }) => {
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  /** Un QR leído entra directo: ya trae el código entero y validado. */
  const handleScan = useCallback(
    (code) => {
      setScanning(false);
      if (!decodeGameCode(code)) {
        setError("Ese QR no es de una partida de lotería.");
        return;
      }
      setCodeInput(code);
      joinRoom(code);
      onJoined(code);
    },
    [onJoined]
  );

  const submit = (event) => {
    event.preventDefault();
    const digits = onlyDigits(codeInput, GAME_CODE_LENGTH);

    if (digits.length !== GAME_CODE_LENGTH) {
      setError(`El código tiene ${GAME_CODE_LENGTH} dígitos.`);
      return;
    }
    if (!decodeGameCode(digits)) {
      setError("Ese código no existe. Revisa los números, hay alguno cambiado.");
      return;
    }

    joinRoom(digits);
    onJoined(digits);
  };

  return (
    <form className="mp-join" onSubmit={submit}>
      <div className="mp-join__row">
        <input
          className="mp-otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={GAME_CODE_LENGTH}
          placeholder="000000"
          value={codeInput}
          onChange={(e) => {
            setCodeInput(onlyDigits(e.target.value, GAME_CODE_LENGTH));
            setError("");
          }}
          aria-label="Código de partida"
          aria-describedby="mp-join-error"
          autoFocus
        />

        {/* El icono de QR junto al campo: se reconoce sin leer nada. */}
        <button type="button" className="mp-join__scan" onClick={() => setScanning(true)} aria-label="Escanear el QR del anfitrión">
          <FaQrcode />
        </button>
      </div>

      <p id="mp-join-error" className={`lot-note ${error ? "lot-note--warn" : ""}`} role={error ? "alert" : undefined}>
        {error || "Los 6 dígitos que canta el anfitrión."}
      </p>

      <button type="submit" className="lot-btn lot-btn--start lot-btn--block">
        Recibir mis cartones
      </button>

      <button type="button" className="lot-btn lot-btn--ghost lot-btn--block" onClick={onOpenHelp}>
        <FaQuestionCircle /> Cómo funciona
      </button>

      <QrScanner isOpen={scanning} onDetected={handleScan} onClose={() => setScanning(false)} />
    </form>
  );
};

JoinForm.propTypes = {
  onJoined: PropTypes.func.isRequired,
  onOpenHelp: PropTypes.func.isRequired,
};

export default JoinForm;
