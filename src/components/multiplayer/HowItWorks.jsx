import PropTypes from "prop-types";
import { FaArrowLeft, FaCrown, FaMobileAlt, FaShieldAlt, FaQrcode, FaHandPointUp } from "react-icons/fa";
import { GAME_MODES } from "../../multiplayer/modes";

/**
 * Pantalla de explicación.
 *
 * Existe por una razón concreta: un juego sin servidor en el que el anfitrión
 * "adivina" el cartón de otro suena a trampa si no se cuenta cómo funciona.
 * Aquí se explica, en el orden en que la gente se lo pregunta.
 */
const HowItWorks = ({ onBack }) => (
  <div className="mp-screen">
    <header className="mp-screen__head">
      <button type="button" className="lot-btn lot-btn--ghost mp-back" onClick={onBack}>
        <FaArrowLeft />
        <span>Volver</span>
      </button>
      <h1 className="mp-screen__title">Cómo funciona</h1>
    </header>

    <div className="mp-screen__body">
      <section className="mp-doc">
        <h2 className="mp-doc__title">
          <FaCrown /> El anfitrión
        </h2>
        <p>Es quien canta las cartas: pone su teléfono en la mesa y todos lo escuchan. Decide todo lo demás:</p>
        <ol className="mp-doc__list">
          <li>
            Elige <strong>cuántos cartones</strong> tiene cada jugador (1, 2 o 3) y el <strong>modo de juego</strong>: cartón lleno, una línea, cuatro
            esquinas…
          </li>
          <li>
            Sale un <strong>código de partida de 6 dígitos</strong> que ya lleva esos ajustes dentro. Si cambia algo, cambia el código: es otra sala.
          </li>
          <li>Enseña el QR o dicta el código y empieza a cantar.</li>
          <li>
            Cuando alguien grita «¡Lotería!», teclea el <strong>código de 5 dígitos</strong> de esa persona y comprueba su cartón al momento.
          </li>
        </ol>
      </section>

      <section className="mp-doc">
        <h2 className="mp-doc__title">
          <FaMobileAlt /> El jugador
        </h2>
        <ol className="mp-doc__list">
          <li>
            Escanea el QR del anfitrión o escribe el código de partida. <strong>No configura nada más</strong>: los cartones y el modo vienen dentro del
            código, así que es imposible acabar jugando con reglas distintas a las de la mesa.
          </li>
          <li>
            Su teléfono le da un <strong>código propio de 5 dígitos</strong> y sus cartones. Ese código es su identidad en la partida: no lo pierda de vista.
          </li>
          <li>
            Escoge con qué va a marcar —frijol, maíz o corcholata— y todo su cartón usa lo mismo.
          </li>
          <li>
            <strong>Marca sus cartas a mano</strong> tocándolas cuando las oye cantar. La casilla tapada se apaga, así que de un vistazo se ve lo que falta.
          </li>
          <li>
            Al completar lo que pide el modo <strong>en cualquiera de sus cartones</strong> —no hacen falta todos—, grita «¡Lotería!» y dice sus 5 dígitos al
            anfitrión.
          </li>
        </ol>
        <p className="mp-doc__note">
          <FaHandPointUp /> Nadie marca las cartas por ti. Si no te das cuenta de una y no pones tu frijol, te la comes: ese despiste es parte del juego de
          siempre.
        </p>
      </section>

      <section className="mp-doc">
        <h2 className="mp-doc__title">
          <FaShieldAlt /> Por qué puedes confiar
        </h2>
        <p>
          Los cartones no viajan por ningún lado: <strong>se calculan</strong>. Con el código de partida más el código del jugador, cualquier teléfono llega
          exactamente al mismo cartón, siempre. Por eso el anfitrión puede reconstruir el tuyo escribiendo cinco números, sin haberlo recibido nunca y sin
          internet de por medio.
        </p>
        <ul className="mp-doc__list">
          <li>
            <strong>No hay servidor.</strong> Nada sale de tu teléfono, no se guarda ningún dato tuyo.
          </li>
          <li>
            <strong>Nadie puede adivinar el sorteo.</strong> El código de partida solo reparte cartones; el orden en que salen las cartas se baraja en vivo en
            el teléfono del anfitrión.
          </li>
          <li>
            <strong>Tu cartón no cambia.</strong> Si cierras la app y vuelves, tu código y tus marcas siguen ahí. Entre ronda y ronda puedes limpiar las
            marcas sin perder el cartón, o pedir cartones nuevos si quieres cambiar de suerte.
          </li>
          <li>
            <strong>Se verifica contra lo cantado.</strong> Al comprobar tu lotería no se miran tus frijoles, se mira si esas cartas salieron de verdad.
          </li>
        </ul>
        <p className="mp-doc__note mp-doc__note--warn">
          Un aviso honesto: como no hay servidor, nada impide que alguien se salga y vuelva a entrar hasta que le guste su cartón. Entre familia y amigos no
          suele importar, pero conviene saberlo.
        </p>
      </section>

      <section className="mp-doc">
        <h2 className="mp-doc__title">
          <FaQrcode /> Modos de juego
        </h2>
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
);

HowItWorks.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default HowItWorks;
