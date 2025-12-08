// App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import PublicContent from './components/PublicContent';
import TemplateDetail from './components/TemplateDetail';

export default function App({ keycloak }) {
    const [token, setToken] = useState(null);

    useEffect(() => {
        if (keycloak?.authenticated && keycloak.token) {
            setTimeout(() => setToken(keycloak.token), 0);
        }
    }, [keycloak]);

    useEffect(() => {
        if (!keycloak?.authenticated) return;

        const interval = setInterval(() => {
            keycloak.updateToken(70).then(refreshed => {
                if (refreshed) setToken(keycloak.token);
            }).catch(() => console.warn('Failed to refresh token'));
        }, 60000);

        return () => clearInterval(interval);
    }, [keycloak]);

    return (
        <BrowserRouter>
            <div>
                <Header keycloak={keycloak} />
                <Routes>
                    <Route path="/" element={<PublicContent />} />
                    <Route path="/template/:id" element={<TemplateDetail token={token} />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}