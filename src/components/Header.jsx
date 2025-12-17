import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import CreateTemplateModal from './CreateTemplateModal';
import LoginModal from './LoginModal';
import { Link } from 'react-router-dom';

export default function Header({ token, setToken }) {
    const [user, setUser] = useState(null);
    const [showLogin, setShowLogin] = useState(false);
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const realmRoles = decoded.realm_access?.roles || [];
                const clientRoles = decoded.resource_access?.['react-app']?.roles || [];
                const rootRoles = decoded.roles || [];
                const allRoles = [...new Set([...realmRoles, ...clientRoles, ...rootRoles])];

                setUser({
                    username: decoded.preferred_username || decoded.name || 'User',
                    email: decoded.email || '',
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
        return hasAdmin || hasManager;
    })();

    const handleLogout = () => {
        localStorage.clear();
        setToken(null);
        window.location.href = '/';
    };

    const handleLoginSuccess = () => {
        setToken(localStorage.getItem('access_token'));
        setShowLogin(false);
    };

    return (
        <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.8rem 2rem',
            background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            position: 'sticky',
            top: 0,
            zIndex: 1000
        }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
                <div style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #64b5f6, #2196f3)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                    Мосстройинформ
                </div>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {user ? (
                    <>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: '0.5rem 1rem',
                            borderRadius: '12px',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #64b5f6, #2196f3)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '1.2rem',
                                boxShadow: '0 4px 10px rgba(33, 150, 243, 0.3)'
                            }}>
                                {user.username[0].toUpperCase()}
                            </div>
                            <div>
                                <div style={{ color: 'white', fontWeight: 600 }}>{user.username}</div>
                                {user.email && (
                                    <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.8rem' }}>
                                        {user.email}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Кнопка личного кабинета */}
                        <Link 
                            to="/profile/orders" 
                            className="btn btn-outline"
                            style={{
                                padding: '10px 20px',
                                borderRadius: '12px',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                background: 'transparent',
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                textDecoration: 'none'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.borderColor = 'white';
                                e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            <span>👤</span> Мой кабинет
                        </Link>

                        {isAdmin && (
    <Link 
        to="/admin"
        className="btn btn-outline"
        style={{
            padding: '10px 20px',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.95rem',
            background: 'transparent',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none'
        }}
        onMouseOver={(e) => {
            e.target.style.background = 'rgba(255, 215, 0, 0.1)';
            e.target.style.borderColor = '#FFD700';
            e.target.style.transform = 'translateY(-2px)';
        }}
        onMouseOut={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            e.target.style.transform = 'translateY(0)';
        }}
    >
        <span>👑</span> Панель админа
    </Link>
)}

                        <button 
                            onClick={handleLogout}
                            style={{
                                padding: '12px 28px',
                                borderRadius: '12px',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                background: 'transparent',
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.borderColor = '#ff4444';
                                e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            <span>🚪</span> Выйти
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={() => setShowLogin(true)}
                        style={{
                            padding: '12px 28px',
                            borderRadius: '12px',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 8px 25px rgba(33, 150, 243, 0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 15px rgba(33, 150, 243, 0.3)';
                        }}
                    >
                        <span>🔑</span> Войти / Регистрация
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