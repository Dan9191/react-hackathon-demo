import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import PublicContent from './components/PublicContent';

export default function App({ keycloak }) {
    const [setToken] = useState(null);

    // Первый токен, после инициализации Keycloak
    useEffect(() => {
        if (keycloak?.authenticated && keycloak.token) {
            // Отложенно устанавливаем token, чтобы избежать синхронного setState
            setTimeout(() => setToken(keycloak.token), 0);
        }
    }, [keycloak?.authenticated, keycloak?.token]);

    // Автообновление токена каждые 60 секунд
    useEffect(() => {
        if (!keycloak?.authenticated) return;

        const interval = setInterval(() => {
            keycloak.updateToken(70)
                .then(refreshed => {
                    if (refreshed) {
                        // Только если токен реально обновился
                        setToken(current => current !== keycloak.token ? keycloak.token : current);
                    }
                })
                .catch(() => console.warn('Failed to refresh token'));
        }, 60000);

        return () => clearInterval(interval);
    }, [keycloak?.authenticated, keycloak]);

    return (
        <div>
            <Header keycloak={keycloak} />
            <PublicContent />
        </div>
    );
}
