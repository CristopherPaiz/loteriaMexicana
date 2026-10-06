/* ============================================================
   Pone la versión del build dentro de dist/sw.js.

   Se ejecuta después de `vite build` (ver el script "build" de package.json),
   no como plugin de Vite: el copiado de public/ ocurre al final y pisaría lo
   que un hook hubiera escrito antes.

   Antes la versión del service worker era una constante escrita a mano. Un
   deploy en el que se olvidara subirla dejaba un sw.js byte a byte idéntico:
   el navegador no detectaba cambio alguno y la app se quedaba vieja por mucho
   que se recargara.

   El id es un hash del propio build —index.html más los nombres (ya con hash)
   de dist/assets—, así que cambia si y solo si cambió algo. Un redeploy sin
   cambios deja el mismo id y no dispara un aviso de actualización vacío.
   ============================================================ */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const dist = resolve(process.cwd(), "dist");
const swPath = resolve(dist, "sw.js");

const sw = readFileSync(swPath, "utf8");

// Se ancla a la declaración entera, no al nombre suelto: el hueco aparece
// también en el comentario de cabecera y un replace a secas se lo comía a él.
const HUECO = 'const BUILD_ID = "__BUILD_ID__";';

if (!sw.includes(HUECO)) {
  console.error(`sw.js no contiene ${HUECO}: el aviso de versión nueva no funcionará.`);
  process.exit(1);
}

const huella = createHash("sha256");
huella.update(readFileSync(resolve(dist, "index.html")));
for (const nombre of readdirSync(resolve(dist, "assets")).sort()) huella.update(nombre);

const buildId = huella.digest("hex").slice(0, 12);
writeFileSync(swPath, sw.replace(HUECO, `const BUILD_ID = "${buildId}";`));

console.log(`sw.js estampado con la versión ${buildId}`);
