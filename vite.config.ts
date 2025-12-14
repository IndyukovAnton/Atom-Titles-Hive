import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path'; // ✅ import path

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src") // ✅ points to /src
    }
  }
});