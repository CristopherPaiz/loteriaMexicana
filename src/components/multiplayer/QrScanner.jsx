import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import jsQR from "jsqr";
import { FaTimes } from "react-icons/fa";
import useModalDismiss from "../../multiplayer/useModalDismiss";
import { codeFromScan } from "../../multiplayer/qr";

// Cada cuánto se mira el fotograma. Más seguido no lee mejor y calienta el
// teléfono para nada.
const SCAN_INTERVAL = 160;

// Se analiza a esta anchura, no a la de la cámara: un fotograma de 1080p tarda
// diez veces más en decodificarse y el QR se lee igual de bien reducido.
const SCAN_WIDTH = 480;

const QrScanner = ({ isOpen, onDetected, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState("");

  useModalDismiss(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return undefined;

    let stream = null;
    let timer = null;
    let cancelled = false;
    let detector = null;

    const finish = (text) => {
      const code = codeFromScan(text);
      if (!code || cancelled) return;
      cancelled = true;
      onDetected(code);
    };

    const scan = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (cancelled || !video || !canvas || video.readyState < 2) return;

      try {
        // BarcodeDetector es nativo y mucho más rápido donde existe (Android).
        // iOS todavía no lo trae, así que jsQR cubre el resto.
        if (detector) {
          const found = await detector.detect(video);
          if (found.length) finish(found[0].rawValue);
          return;
        }

        const scale = SCAN_WIDTH / video.videoWidth;
        canvas.width = SCAN_WIDTH;
        canvas.height = Math.round(video.videoHeight * scale);

        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(image.data, image.width, image.height, { inversionAttempts: "dontInvert" });
        if (result) finish(result.data);
      } catch (scanError) {
        console.error("Fallo al analizar el fotograma:", scanError);
      }
    };

    const start = async () => {
      if (!window.isSecureContext) {
        setError("La cámara solo funciona en conexiones seguras (https).");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Este navegador no deja usar la cámara. Escribe el código a mano.");
        return;
      }

      try {
        // facingMode ideal, no exact: en un portátil sin cámara trasera un
        // exact haría fallar la petición entera.
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const video = videoRef.current;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.muted = true;
        await video.play();

        if (window.BarcodeDetector) {
          const formats = await window.BarcodeDetector.getSupportedFormats();
          if (formats.includes("qr_code")) detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        }

        timer = setInterval(scan, SCAN_INTERVAL);
      } catch (cameraError) {
        console.error("No se pudo abrir la cámara:", cameraError);
        setError(
          cameraError?.name === "NotAllowedError"
            ? "No diste permiso a la cámara. Puedes escribir el código a mano."
            : "No se pudo abrir la cámara. Escribe el código a mano."
        );
      }
    };

    start();

    return () => {
      cancelled = true;
      clearInterval(timer);
      // Sin esto la luz de la cámara se queda encendida tras cerrar.
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [isOpen, onDetected]);

  useEffect(() => {
    if (isOpen) setError("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="lot-modal-overlay lot-modal-overlay--top" onClick={onClose} role="presentation">
      <div className="lot-modal mp-scan" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Escanear el QR">
        <header className="lot-modal__header">
          <div className="lot-modal__heading">
            <h2 className="lot-modal__title">Escanear el QR</h2>
          </div>
          <button type="button" className="lot-panel__close" onClick={onClose} aria-label="Cerrar">
            <FaTimes />
          </button>
        </header>

        <div className="lot-modal__body mp-scan__body">
          {error ? (
            <p className="lot-note lot-note--warn">{error}</p>
          ) : (
            <>
              <div className="mp-scan__frame">
                <video ref={videoRef} className="mp-scan__video" playsInline muted />
                <span className="mp-scan__reticle" aria-hidden="true" />
              </div>
              <p className="lot-note">Apunta al código que enseña el anfitrión.</p>
            </>
          )}

          <canvas ref={canvasRef} hidden />

          <button type="button" className="lot-btn lot-btn--ghost lot-btn--block" onClick={onClose}>
            Mejor lo escribo
          </button>
        </div>
      </div>
    </div>
  );
};

QrScanner.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onDetected: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default QrScanner;
