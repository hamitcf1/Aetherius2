import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BASE_PATH } from './services/basePath';

// Ensure global APP_BASE_PATH is set early for non-module assets
if (typeof window !== 'undefined') (window as any).APP_BASE_PATH = (window as any).APP_BASE_PATH || BASE_PATH;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);