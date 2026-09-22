import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { syncOfflineSales } from './lib/offlineSync';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

window.addEventListener('online', () => { void syncOfflineSales(); });
void syncOfflineSales();

if ('serviceWorker' in navigator) { window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js')); }
