import { nitro } from 'nitro/vite'
import { workflow } from 'workflow/vite'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  nitro: {
    serverDir: './',
  },
  plugins: [
    nitro(),
    workflow(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
