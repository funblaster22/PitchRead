import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    proxy: {
      // string shorthand, see [docs](https://vitejs.dev/config/#server-proxy)
      '/scores': 'http://localhost:3030',
    }
  }
})
