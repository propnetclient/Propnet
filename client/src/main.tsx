import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Error boundary for PWA startup issues
function handleStartupError(error: Error) {
  console.error('App startup error:', error);
  
  // Show fallback UI if React fails to mount
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #2563eb;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 20px;
        box-sizing: border-box;
      ">
        <h1 style="margin-bottom: 16px;">PropNet</h1>
        <p style="margin-bottom: 16px;">Loading app...</p>
        <button onclick="window.location.reload()" style="
          background: white;
          color: #2563eb;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        ">Retry</button>
      </div>
    `;
  }
}

// Register service worker with error handling
async function initializePWA() {
  try {
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    }
  } catch (error) {
    console.warn('Service worker registration failed:', error);
  }
}

// Initialize app with comprehensive error handling
try {
  initializePWA();
  
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  createRoot(rootElement).render(<App />);
} catch (error) {
  handleStartupError(error as Error);
}
