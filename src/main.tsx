import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppProviders } from './components/layout/AppProviders';
import { ScrollToTop } from './components/layout/ScrollToTop';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <BrowserRouter>
        <ScrollToTop />
        <App />
      </BrowserRouter>
    </AppProviders>
  </React.StrictMode>
);
