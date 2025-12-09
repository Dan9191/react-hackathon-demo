import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import PublicContent from './components/PublicContent';
import TemplateDetail from './components/TemplateDetail';
import { getAuthConfig } from './auth-config';

export default function App() {
    const [token, setToken] = useState(localStorage.getItem('access_token'));

    useEffect(() => {
        const refreshInterval = setInterval(async () => {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) return;

            const { KEYCLOAK_URL, REALM, CLIENT_ID } = getAuthConfig();

            const body = new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: CLIENT_ID,
                refresh_token: refreshToken,
            });

            try {
                const res = await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body,
                });

                if (res.ok) {
                    const data = await res.json();
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('refresh_token', data.refresh_token);
                    localStorage.setItem('token_expires_at', Date.now() + data.expires_in * 1000);
                    setToken(data.access_token);
                } else {
                    console.warn('Token refresh failed');
                    localStorage.clear();
                    setToken(null);
                }
            } catch (err) {
                console.error('Refresh error:', err);
            }
        }, 60000); // Каждую минуту

        return () => clearInterval(refreshInterval);
    }, []);

    return (
        <BrowserRouter>
            <Header token={token} setToken={setToken} />
            <Routes>
                <Route path="/" element={<PublicContent />} />
                <Route path="/template/:id" element={<TemplateDetail token={token} />} />
            </Routes>
        </BrowserRouter>
    );
}