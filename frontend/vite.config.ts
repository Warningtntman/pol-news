import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    proxy: {
      // Forward frontend `/api/*` calls to the FastAPI backend during development.
      // This avoids CORS and lets the frontend just call `/api/news`.
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      },
      // FastAPI serves OpenAPI at /openapi.json and Swagger at /docs on :8000.
      // If you open those URLs on the Vite origin (e.g. localhost:5173/docs), the
      // browser would otherwise request /openapi.json from :5173 and fail with NetworkError.
      '/openapi.json': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/docs': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/redoc': {
        target: backendUrl,
        changeOrigin: true,
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
