import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import CreateTemplateModal from './CreateTemplateModal';
import LoginModal from './LoginModal';

export default function Header({ token, setToken }) {
    const [user, setUser] = useState(null);
    const [showLogin, setShowLogin] = useState(false);
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);

                // Собираем роли отовсюду — теперь точно найдём!
                const realmRoles = decoded.realm_access?.roles || [];
                const clientRoles = decoded.resource_access?.['react-app']?.roles || [];
                const rootRoles = decoded.roles || []; // ← это у тебя с ROLE_

                const allRoles = [...new Set([...realmRoles, ...clientRoles, ...rootRoles])];

                setUser({
                    username: decoded.preferred_username || decoded.name || 'User',
                    roles: allRoles
                });
            } catch (err) {
                console.error('Token decode error:', err);
                localStorage.clear();
                setUser(null);
            }
        } else {
            setUser(null);
        }
    }, [token]);

    const isAdmin = (() => {
        if (!user?.roles) return false;
        const hasAdmin = user.roles.includes('ROLE_hackathon.admin');
        const hasManager = user.roles.includes('ROLE_hackathon.manager');
        console.log('Роли пользователя:', user.roles); // ← ВКЛЮЧИ ЭТУ СТРОКУ!
        console.log('isAdmin?', hasAdmin || hasManager);
        return hasAdmin || hasManager;
    })();

    const handleLogout = () => {
        localStorage.clear();
        window.location.reload();
    };

    const handleLoginSuccess = () => {
        setToken(localStorage.getItem('access_token'));
        setShowLogin(false);
        window.location.reload();
    };

    return (
        <header className="main-nav">
            <div className="nav-logo">Мосстройинформ</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {user ? (
                    <>
                        <div className="user-avatar">
                            {user.username[0].toUpperCase()}
                        </div>
                        <span>{user.username}</span>

                        {isAdmin && (
                            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                                Создать шаблон
                            </button>
                        )}

                        <button onClick={handleLogout} className="btn btn-outline">
                            Выйти
                        </button>
                    </>
                ) : (
                    <button onClick={() => setShowLogin(true)} className="btn btn-primary">
                        Войти
                    </button>
                )}
            </div>

            {showLogin && (
                <LoginModal
                    onClose={() => setShowLogin(false)}
                    onSuccess={handleLoginSuccess}
                />
            )}

            {showCreate && (
                <CreateTemplateModal
                    token={token}
                    onClose={() => setShowCreate(false)}
                    onSuccess={() => window.location.reload()}
                />
            )}
        </header>
    );
}