import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BASE_PATH } from './services/basePath';
import './styles/rarity.css';
import './styles/scrollbars.css';
import { initButtonTooltips } from './utils/buttonTooltips';
import { LocalizationProvider } from './services/localization';

// Ensure global APP_BASE_PATH is set early for non-module assets
if (typeof window !== 'undefined') (window as any).APP_BASE_PATH = (window as any).APP_BASE_PATH || BASE_PATH;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LocalizationProvider>
      <App />
    </LocalizationProvider>
  </React.StrictMode>
);

// Initialize global button tooltips to provide short hover explanations
// for buttons when a developer hasn't explicitly added `title` attributes.
// Run after render so initial buttons are present in the DOM.
if (typeof window !== 'undefined') {
  // Delay briefly to allow initial mount to populate DOM
  requestAnimationFrame(() => {
    try { initButtonTooltips(); } catch (e) { /* ignore in non-DOM envs */ }
  });
}