import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { loadConfig } from './config';
import { loadKeycloakConfig } from './keycloak-config';
import { initKeycloak } from './keycloak';

Promise.all([loadConfig(), loadKeycloakConfig()])
    .then(() => initKeycloak())
    .then((keycloak) => {
        ReactDOM.createRoot(document.getElementById('root')).render(
            <React.StrictMode>
                <App keycloak={keycloak} />
            </React.StrictMode>
        );
    })
    .catch((err) => {
        console.error('App init failed:', err);
        document.getElementById('root').innerHTML = '<h1 style="color:red;padding:50px">Ошибка запуска приложения</h1>';
    });