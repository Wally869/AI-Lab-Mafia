import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/, not the domain root
  base: process.env.GITHUB_ACTIONS ? '/AI-Lab-Mafia/' : '/',
  plugins: [svelte(), tailwindcss()],
});
