import React, { useState } from 'react';
import CreateTemplateModal from './CreateTemplateModal';

export default function Header({ keycloak }) {
    const [showCreateModal, setShowCreateModal] = useState(false);

    const handleLogin = () => keycloak.login();
    const handleLogout = () => keycloak.logout({ redirectUri: window.location.origin });

    const roles = keycloak.tokenParsed?.roles || [];
    const isAdmin = roles.includes('ROLE_hackathon.admin') || roles.includes('ROLE_hackathon.manager');

    return (
        <header className="main-nav">
            <div className="nav-logo">Мосстройинформ</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {keycloak.authenticated ? (
                    <>
                        <div className="user-avatar">
                            {keycloak.tokenParsed?.preferred_username?.[0].toUpperCase()}
                        </div>
                        <span>{keycloak.tokenParsed?.preferred_username}</span>

                        {isAdmin && (
                            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                                Создать шаблон
                            </button>
                        )}

                        <button onClick={handleLogout} className="btn btn-outline">
                            Выйти
                        </button>
                    </>
                ) : (
                    <button onClick={handleLogin} className="btn btn-primary">
                        Войти
                    </button>
                )}
            </div>

            {showCreateModal && (
                <CreateTemplateModal
                    token={keycloak.token}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => window.location.reload()}
                />
            )}
        </header>
    );
}