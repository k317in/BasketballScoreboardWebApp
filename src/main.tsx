import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// PWA service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Hide address bar on mobile
const hideAddressBar = () => {
  if (window.innerHeight < window.outerHeight) {
    setTimeout(() => {
      window.scrollTo(0, 1);
    }, 100);
  }
};

// Execute on load and orientation change
window.addEventListener('load', hideAddressBar);
window.addEventListener('orientationchange', hideAddressBar);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
