import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against window.alert and window.open blocking in iframe preview environment
if (typeof window !== 'undefined') {
  window.alert = (msg?: any) => {
    console.warn('[Notification]:', msg);
  };
}

createRoot(document.getElementById('root')!).render(<App />);
