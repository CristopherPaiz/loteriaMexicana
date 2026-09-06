import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import QRCode from "qrcode";

/**
 * QR del enlace para unirse. Es el atajo cómodo: quien puede escanear no
 * teclea nada. El código de 6 dígitos sigue debajo como plan B, porque no
 * todos los teléfonos leen QR desde la cámara sin instalar algo.
 */
const QrCode = ({ value, size = 208 }) => {
  const canvasRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;

    setFailed(false);

    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      // Alto contraste: el fondo de la app es oscuro y muchos lectores fallan
      // con un QR claro sobre claro.
      color: { dark: "#101219", light: "#ffffff" },
    }).catch((error) => {
      console.error("No se pudo dibujar el QR:", error);
      setFailed(true);
    });
  }, [value, size]);

  if (failed) {
    return <p className="lot-note">No se pudo generar el QR. Comparte el código de 6 dígitos.</p>;
  }

  return (
    <div className="mp-qr">
      <canvas ref={canvasRef} width={size} height={size} role="img" aria-label="Código QR para unirse a la partida" />
    </div>
  );
};

QrCode.propTypes = {
  value: PropTypes.string.isRequired,
  size: PropTypes.number,
};

export default QrCode;
