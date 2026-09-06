/* ============================================================
   Marcadores: frijoles, maíces o corcholatas.

   Un cartón usa un solo tipo, el que elija su dueño al recibirlo. Mezclar
   frijoles con corcholatas en la misma rejilla se veía desordenado, y en la
   mesa de verdad tampoco pasa: cada quien juega con lo suyo.

   Dentro de ese tipo sí hay variedad: cada casilla saca su propia variante, su
   propio giro y un ligero desplazamiento, para que un cartón lleno no parezca
   una plantilla sino quince cosas echadas a mano sobre la mesa.

   El azar es determinista: se calcula a partir de la carta y su posición, no
   con Math.random(). Así el frijol no pega un brinco cada vez que React
   redibuja, y sigue igual después de cerrar y volver a abrir la app.
   ============================================================ */

import { randomFromSeed } from "./rng.js";

const VARIANTS = 5;

// `size` ajusta cada tipo a ojo: la corcholata es plana y redonda, así que
// necesita algo más de diámetro para pesar lo mismo en la casilla que un
// frijol o un grano de maíz.
export const MARKER_KINDS = [
  { id: "frijol", label: "Frijol", hint: "El de toda la vida", size: 1 },
  { id: "maiz", label: "Maíz", hint: "Grano amarillo, bien visible", size: 1 },
  { id: "corcholata", label: "Corcholata", hint: "Tapitas de refresco", size: 1.1 },
];

export const DEFAULT_MARKER_KIND = MARKER_KINDS[0].id;

const KIND_IDS = MARKER_KINDS.map((kind) => kind.id);

export const isMarkerKind = (id) => KIND_IDS.includes(id);

export const markerLabel = (id) => MARKER_KINDS.find((kind) => kind.id === id)?.label ?? MARKER_KINDS[0].label;

/** Todas las imágenes, para precargarlas de golpe si hiciera falta. */
export const ALL_MARKER_SOURCES = KIND_IDS.flatMap((id) => Array.from({ length: VARIANTS }, (_, i) => `/sprites/${id}${i + 1}.webp`));

/**
 * Aspecto del marcador de una casilla.
 *
 * @param {string} kind  frijol | maiz | corcholata
 * @param {string|number} key  algo estable y único de la casilla (carta + posición)
 */
export const markerFor = (kind, key) => {
  const id = isMarkerKind(kind) ? kind : DEFAULT_MARKER_KIND;
  const base = MARKER_KINDS.find((item) => item.id === id).size;
  const random = randomFromSeed(`marcador:${id}:${key}`);

  return {
    src: `/sprites/${id}${Math.floor(random() * VARIANTS) + 1}.webp`,
    // Giro completo: los frijoles y los maíces no tienen "derecho" ni "revés".
    rotation: Math.round(random() * 360),
    // Variación de tamaño y posición pequeña, lo justo para romper la rejilla.
    scale: base * (0.9 + random() * 0.22),
    offsetX: (random() - 0.5) * 12,
    offsetY: (random() - 0.5) * 12,
  };
};

/** Tres ejemplos de un tipo, para enseñarlo en la pantalla de elección. */
export const markerPreview = (kind) => [0, 1, 2].map((i) => markerFor(kind, `muestra-${i}`));
