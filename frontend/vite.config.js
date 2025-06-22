import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
const allowedHosts = import.meta.env.VITE_ALLOWED_HOSTS || 'localhost,127.0.0.1'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: allowedHosts.split(','),
  },
})
