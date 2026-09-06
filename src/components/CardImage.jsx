import { useEffect, useState } from "react";
import PropTypes from "prop-types";

/* Imagen de carta con reintentos.
 *
 * La fuente preferida es el blob cacheado, pero puede faltar o haberse guardado
 * mal. Si falla, se pide de nuevo el archivo original y, si vuelve a fallar, se
 * repite saltándose la caché del navegador. Solo tras agotar los intentos se
 * muestra un hueco con el número, nunca el icono de imagen rota.
 */
const CardImage = ({ card, typeCard, getCardImageUrl, alt, className = "", style, loading }) => {
  const [attempt, setAttempt] = useState(0);

  // Cambiar de carta o de estilo reinicia la cadena de intentos.
  useEffect(() => {
    setAttempt(0);
  }, [card, typeCard]);

  if (!card) return null;

  const directUrl = `/${typeCard}WEBP/${card}.webp`;
  const sources = [getCardImageUrl(card) || directUrl, directUrl, `${directUrl}?reintento=1`];

  if (attempt >= sources.length) {
    return (
      <span className={`lot-card-fallback ${className}`.trim()} style={style} role="img" aria-label={alt}>
        {card}
      </span>
    );
  }

  return (
    <img
      src={sources[attempt]}
      alt={alt}
      className={className || undefined}
      style={style}
      loading={loading}
      onError={() => setAttempt((prev) => prev + 1)}
    />
  );
};

CardImage.propTypes = {
  card: PropTypes.number,
  typeCard: PropTypes.string.isRequired,
  getCardImageUrl: PropTypes.func.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  loading: PropTypes.string,
};

export default CardImage;
