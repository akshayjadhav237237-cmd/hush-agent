import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/instrument-serif/index.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/geist/index.css';
import '@fontsource-variable/geist-mono/index.css';
import '@/styles/tokens.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
