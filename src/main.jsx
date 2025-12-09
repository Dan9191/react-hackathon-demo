import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { loadAuthConfig } from './auth-config';
import { loadConfig } from './config';

Promise.all([loadAuthConfig(), loadConfig()])
    .then(() => {
        ReactDOM.createRoot(document.getElementById('root')).render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
    })
    .catch(console.error);