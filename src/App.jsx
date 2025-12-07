import React, { useEffect } from 'react';
import Header from './components/Header';
import PublicContent from './components/PublicContent';
import EventTable from './components/EventTable';


export default function App({ keycloak }) {
    // Автообновление токена каждую минуту
    useEffect(() => {
        if (!keycloak?.authenticated) return;

        const interval = setInterval(() => {
            keycloak.updateToken(70).catch(() => {
                console.warn('Failed to refresh token');
            });
        }, 60000);

        return () => clearInterval(interval);
    }, [keycloak?.authenticated]);

    return (
        <div>
            <Header keycloak={keycloak} />
            <PublicContent />
            {keycloak?.authenticated && <EventTable token={keycloak.token} />}
        </div>
    );
}
