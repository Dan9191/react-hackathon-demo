import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { loadAllConfigs } from './auth-config';
import { loadConfig } from './config';

Promise.all([loadAllConfigs(), loadConfig()])
    .then(() => {
        ReactDOM.createRoot(document.getElementById('root')).render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
    })
    .catch(console.error);