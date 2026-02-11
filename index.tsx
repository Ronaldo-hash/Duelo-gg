
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
console.log("🚀 Tentando montar o React App...");

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

console.log("✅ Render chamado!");
