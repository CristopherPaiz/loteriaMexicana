import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
