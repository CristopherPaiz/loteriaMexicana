import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { FaTimes, FaCrown, FaMobileAlt, FaShieldAlt, FaListUl, FaHandPointUp } from "react-icons/fa";
import { GAME_MODES } from "../../multiplayer/modes";
import useModalDismiss from "../../multiplayer/useModalDismiss";

/**
 * Explicación, como modal encima de donde se pidió.
 *
 * Existe por una razón concreta: un juego sin servidor en el que el anfitrión
 * "adivina" el cartón de otro suena a trampa si no se cuenta cómo funciona.
 * Aquí se explica, en el orden en que la gente se lo pregunta.
 */
const HowItWorks = ({ isOpen, onClose }) => {
  const closeRef = useRef(null);

  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  useModalDismiss(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="lot-modal-overlay lot-modal-overlay--top" onClick={onClose} role="presentation">
      <div className="lot-modal mp-help" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Cómo funciona">
        <header className="lot-modal__header">
          <div className="lot-modal__heading">
            <h2 className="lot-modal__title">Cómo funciona</h2>
          </div>
          <button ref={closeRef} type="button" className="lot-panel__close" onClick={onClose} aria-label="Cerrar">
            <FaTimes />
          </button>
        </header>

        <div className="lot-modal__body">
          <section className="mp-doc">
            <h3 className="mp-doc__title">
              <FaCrown /> El anfitrión
            </h3>
            <ol className="mp-doc__list">
              <li>Elige cuántos cartones tiene cada quien y el modo de juego.</li>
              <li>
                Sale un código de 6 dígitos con esos ajustes dentro. Si cambia algo, cambia el código: es <strong>otra sala</strong>.
              </li>
              <li>Enseña el QR o dicta el código, y canta las cartas.</li>
              <li>Cuando alguien grita lotería, teclea sus 5 dígitos y comprueba su cartón al momento.</li>
            </ol>
          </section>

          <section className="mp-doc">
            <h3 className="mp-doc__title">
              <FaMobileAlt /> El jugador
            </h3>
            <ol className="mp-doc__list">
              <li>Escanea el QR o escribe el código. No configura nada más.</li>
              <li>
                Su teléfono le da un <strong>código propio de 5 dígitos</strong> y sus cartones.
              </li>
              <li>Escoge con qué marcar y va tapando sus cartas a mano. Lo tapado se apaga.</li>
              <li>
                Al completar el patrón <strong>en cualquiera de sus cartones</strong>, canta y dice sus 5 dígitos.
              </li>
            </ol>
            <p className="mp-doc__note">
              <FaHandPointUp /> Nadie marca por ti. Si no te das cuenta de una carta, te la comes: ese despiste es parte del juego de siempre.
            </p>
          </section>

          <section className="mp-doc">
            <h3 className="mp-doc__title">
              <FaShieldAlt /> Por qué puedes confiar
            </h3>
            <p>
              Los cartones no viajan a ningún lado: <strong>se calculan</strong>. Con el código de la partida más el del jugador, cualquier teléfono llega al
              mismo cartón. Por eso el anfitrión reconstruye el tuyo con cinco números, sin haberlo recibido nunca y sin internet.
            </p>
            <ul className="mp-doc__list">
              <li>
                <strong>No hay servidor.</strong> Nada sale de tu teléfono.
              </li>
              <li>
                <strong>El sorteo no se puede adivinar.</strong> El código reparte cartones; el mazo se baraja en vivo.
              </li>
              <li>
                <strong>Se verifica contra lo cantado</strong>, no contra tus marcas.
              </li>
            </ul>
            <p className="mp-doc__note mp-doc__note--warn">
              Aviso honesto: sin servidor, nada impide que alguien pida cartón nuevo hasta que le guste. Entre familia no suele importar, pero conviene saberlo.
            </p>
          </section>

          <section className="mp-doc">
            <h3 className="mp-doc__title">
              <FaListUl /> Modos de juego
            </h3>
            <dl className="mp-doc__modes">
              {GAME_MODES.map((mode) => (
                <div key={mode.id} className="mp-doc__mode">
                  <dt>{mode.label}</dt>
                  <dd>{mode.description}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
};

HowItWorks.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default HowItWorks;
