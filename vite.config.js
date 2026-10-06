import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

/**
 * Identidad del build: qué commit es y de cuándo.
 *
 * Se usa el commit y NO la hora de compilar a propósito. La hora cambiaría en
 * cada build, y como el aviso de versión nueva se calcula sobre el contenido
 * del bundle, un redeploy sin cambios acabaría molestando a todo el mundo con
 * una "actualización" que no actualiza nada.
 *
 * En Vercel el sha llega por variable de entorno; en local y como respaldo, de
 * git. Si no hay ninguno de los dos (un zip sin .git), se degrada a "dev".
 */
const gitOrNull = (orden) => {
  try {
    return execSync(orden, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || null;
  } catch {
    return null;
  }
};

const commit = (process.env.VERCEL_GIT_COMMIT_SHA || gitOrNull("git rev-parse HEAD") || "").slice(0, 7) || "dev";
const fecha = gitOrNull("git log -1 --format=%cI") || new Date().toISOString();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(commit),
    __APP_DATE__: JSON.stringify(fecha),
  },
  build: {
    rollupOptions: {
      output: {
        // React cambia una vez al año; el juego, en cada deploy. Separarlos deja
        // que el navegador conserve el vendor en caché entre versiones.
        //
        // Solo se separa React: el resto de librerías pesadas (jsPDF, jsQR,
        // qrcode) ya salen en trozos propios porque se importan con lazy().
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "react-vendor";
          return undefined;
        },
      },
    },
  },
});
