import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import OfflineIndicator from './components/OfflineIndicator'
import { registerServiceWorker, startReminderScheduler } from './services/notificationService'

// Register service worker for PWA and notifications
registerServiceWorker();

// Start the task reminder scheduler
startReminderScheduler();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <OfflineIndicator />
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
)

