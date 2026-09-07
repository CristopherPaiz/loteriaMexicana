# Lotería Mexicana

Gritón de lotería para jugar en familia: un teléfono o una tele canta las cartas
con voz de verdad, y quien quiera puede recibir sus cartones en su propio móvil.

**Jugar:** <https://loteria-crp.vercel.app/>

Es una PWA: se instala, funciona sin conexión y no necesita cuenta ni servidor.

## Qué hace

- **Gritón automático.** Baraja las 54 cartas y las canta al ritmo que elijas,
  con cuatro voces (hombre, mujer, niño, joven) y dos estilos de carta (HD/SD).
- **Cartones en el móvil.** El anfitrión abre una sala, los demás entran con un
  código de 6 dígitos o escaneando un QR. Cada quien marca sus casillas con
  frijoles, maíces o corcholatas.
- **Seis modos:** clásico (cartón lleno), línea, cuatro esquinas, centro,
  letra L y express.
- **Verificación de la lotería cantada.** El anfitrión teclea los 5 dígitos del
  jugador y ve todos sus cartones reconstruidos, con el veredicto y, si no ganó,
  qué cartas le faltaban.
- **Generador de cartones para imprimir** en PDF (10, 17 o 27 cartones).
- **La partida sobrevive a un refresco:** se ofrece reanudar donde iba.

## Multijugador sin servidor

No hay backend. Ni base de datos, ni websockets, ni despliegue que mantener.

La idea: **un cartón se calcula, nunca se transmite.** Con el código de partida,
el código del jugador y el número de cartón, cualquier dispositivo llega al mismo
resultado, porque todos parten de la misma semilla determinista.

```
semilla → FNV-1a → mulberry32 → Fisher-Yates parcial → 16 cartas de las 54
```

Así el anfitrión puede reconstruir el cartón de cualquiera sin haberlo recibido
nunca. Lo único que viaja entre teléfonos son dígitos dichos en voz alta.

Dos decisiones sostienen esto:

**El código de partida lleva la configuración dentro.** No es solo una semilla:

```
payload = semilla * 24 + modo * 3 + (cartones - 1)   (5 dígitos)
código  = payload + dígito de control                (6 dígitos)
```

El jugador no elige nada —teclea seis dígitos y su teléfono deduce cuántos
cartones y qué modo—, así que el desajuste más molesto (el anfitrión reparte 3 y
un jugador se queda con 1) es imposible por construcción. El dígito de control
usa pesos alternos 3/1, como EAN: detecta todo dedazo de un dígito y casi toda
transposición de vecinos.

**La semilla NO baraja el mazo.** Solo reparte cartones. Si decidiera también el
orden en que salen las cartas, cualquiera podría calcular la baraja entera por
adelantado y saber de antemano si va a ganar. El mazo se baraja en vivo, con
`Math.random()`, en el teléfono del anfitrión.

> Corolario: las funciones de `src/multiplayer/rng.js` no pueden cambiar de
> comportamiento nunca. Si se tocan, los cartones dejan de coincidir entre
> versiones y una partida a medias se rompe.

## Desarrollo

```bash
npm install
npm run dev
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Vite + HMR) |
| `npm run build` | Compila a `dist/` |
| `npm run preview` | Sirve `dist/` para probar el build |
| `npm run lint` | ESLint sobre todo el proyecto |
| `npm run test:cartones` | Comprueba el núcleo determinista del multijugador |

`test:cartones` no es un framework: es un script que falla ruidosamente si
alguna de las garantías que sostienen el juego sin servidor deja de cumplirse
(cartones deterministas, códigos que van y vuelven, patrones de victoria,
marcadores estables). **Córrelo antes de tocar `src/multiplayer/`.**

## Cómo está montado

React 18 + Vite, sin router ni gestor de estado. El enrutado va por hash a
propósito: funciona en cualquier hosting estático, aguanta un refresco sin
configurar nada en el servidor y no añade dependencias.

```
src/
  Loteria.jsx            Pantalla del anfitrión: mazo, audio, temporizador
  App.jsx                Enrutado por hash
  multiplayer/           Núcleo puro, sin React ni DOM
    rng.js               FNV-1a + mulberry32 + Fisher-Yates parcial
    boards.js            Cartones deterministas
    codes.js             Códigos de 6 y 5 dígitos, dígito de control
    modes.js             Modos como máscaras de 16 bits, verificación
    markers.js           Frijoles/maíces/corcholatas deterministas
    session.js           Rutas por hash y estado en localStorage
  components/            UI del anfitrión
  components/multiplayer/ UI de sala, cartón del jugador, QR, verificación
public/
  HDWEBP/ SDWEBP/        Las 54 cartas en dos calidades
  sounds/                Voces y efectos
  sprites/               Marcadores
  sw.js                  Service worker
```

### Rutas

| Hash | Pantalla |
| --- | --- |
| `#/` | Anfitrión (el gritón) |
| `#/unirse` | Inicio con el modal de entrada abierto |
| `#/jugador` | El cartón propio, de la partida guardada |
| `#/jugador/<código>` | Entrar directo (esto es lo que lleva el QR) |

### Carga y offline

El arranque solo baja lo mínimo para jugar (imágenes del estilo inicial + voz por
defecto); el resto se descarga en segundo plano. Los modales pesados —generador
de PDF, lector de QR, dibujo del QR— van en trozos aparte con `lazy()` y se
precargan en tiempo muerto, para que estén en caché cuando no haya red.

El service worker usa red primero para el HTML (así un deploy nuevo se ve al
recargar) y caché primero para los assets (son inmutables).

> **Al desplegar:** si cambias cualquier archivo de `public/` sin renombrarlo,
> sube `CACHE_VERSION` en [`public/sw.js`](public/sw.js). Si no, quien ya tenga la
> app instalada seguirá viendo el archivo viejo indefinidamente.

## Añadir un modo de juego

Un modo es un nombre y una lista de patrones; un patrón es una máscara de 16 bits
sobre la rejilla 4×4 (índice `fila * 4 + columna`). Añadir una entrada a
`GAME_MODES` en [`src/multiplayer/modes.js`](src/multiplayer/modes.js) basta:
nada más del sistema necesita enterarse.

Hay 8 huecos reservados en el código de partida y hoy se usan 6, así que caben
dos modos más sin que los códigos cambien de significado. **Añadir el séptimo
modo no invalida códigos existentes; reordenar `GAME_MODES` sí.**

## Créditos

Hecho por [Cristopher Paiz](https://github.com/CristopherPaiz).
