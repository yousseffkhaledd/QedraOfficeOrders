import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // lets colleagues open it via your machine's IP on the office network
    port: 5173,
    proxy: {
      // xfwd: pass each person's real IP to the backend (X-Forwarded-For),
      // otherwise every request would look like it came from this machine
      '/api': { target: 'http://localhost:3000', xfwd: true },
    },
  },
});