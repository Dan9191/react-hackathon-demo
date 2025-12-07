import React from 'react';

export default function Header({ keycloak }) {
    const handleLogin = () => keycloak.login();
    const handleLogout = () =>
        keycloak.logout({ redirectUri: window.location.origin });

    return (
        <header
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '1rem',
                borderBottom: '1px solid #ccc',
            }}
        >
            <div>My Hackathon App</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {keycloak.authenticated ? (
                    <>
                        {/* Иконка / имя пользователя */}
                        <div
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: '#007bff',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                            }}
                        >
                            {keycloak.tokenParsed?.['preferred_username'][0].toUpperCase()}
                        </div>
                        <span>{keycloak.tokenParsed?.['preferred_username']}</span>
                        <button onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <button onClick={handleLogin}>Login</button>
                )}
            </div>
        </header>
    );
}
