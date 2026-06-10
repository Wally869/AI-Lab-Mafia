import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { resetFounder } from './lib/controller.svelte';

declare global {
  interface Window {
    resetFounder: () => void;
  }
}

// Dev helper: `resetFounder()` in the console, or visit with `?reset`.
window.resetFounder = resetFounder;
if (new URLSearchParams(location.search).has('reset')) {
  resetFounder();
}

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
