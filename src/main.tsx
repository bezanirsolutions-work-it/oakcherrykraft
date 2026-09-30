import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppProviders } from './components/layout/AppProviders';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { initPerfInstrumentation } from './lib/perfInstrumentation';
import './styles/global.css';

// Initialize performance instrumentation for development debugging
initPerfInstrumentation();

const root = document.getElementById('root')!;
const app = (
  <React.StrictMode>
    <AppProviders>
      <BrowserRouter>
        <ScrollToTop />
        <App />
      </BrowserRouter>
    </AppProviders>
  </React.StrictMode>
);

if (root.dataset.prerendered === 'true') {
  document.head
    .querySelectorAll('title, meta[name="description"], link[rel="canonical"], meta[property^="og:"], meta[name^="twitter:"], script[type="application/ld+json"]')
    .forEach((element) => element.remove());
  root.replaceChildren();
  delete root.dataset.prerendered;
}

ReactDOM.createRoot(root).render(app);
