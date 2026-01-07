import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import CreateTemplateModal from './CreateTemplateModal';
import LoginModal from './LoginModal';
import { getConfig } from '../config';
import { Link } from 'react-router-dom';

// Новый компонент модального окна для редактирования профиля
const EditProfileModal = ({ user, token, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        surname: user?.surname || '',
        email: user?.email || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setSuccess('Профиль успешно обновлен');
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1500);
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Ошибка при обновлении профиля');
            }
        } catch (err) {
            setError('Ошибка сети или сервера');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '2rem',
                width: '90%',
                maxWidth: '500px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <h2 style={{
                        margin: 0,
                        color: '#1a237e',
                        fontSize: '1.5rem',
                        fontWeight: 700
                    }}>
                        Редактирование профиля
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: '#666',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.background = '#f5f5f5';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.background = 'none';
                        }}
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            color: '#333',
                            fontWeight: 500,
                            fontSize: '0.9rem'
                        }}>
                            Имя
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '2px solid #e0e0e0',
                                borderRadius: '10px',
                                fontSize: '1rem',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#2196F3';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e0e0e0';
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            color: '#333',
                            fontWeight: 500,
                            fontSize: '0.9rem'
                        }}>
                            Фамилия
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '2px solid #e0e0e0',
                                borderRadius: '10px',
                                fontSize: '1rem',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#2196F3';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e0e0e0';
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            color: '#333',
                            fontWeight: 500,
                            fontSize: '0.9rem'
                        }}>
                            Отчество
                        </label>
                        <input
                            type="text"
                            name="surname"
                            value={formData.surname}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '2px solid #e0e0e0',
                                borderRadius: '10px',
                                fontSize: '1rem',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#2196F3';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e0e0e0';
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            color: '#333',
                            fontWeight: 500,
                            fontSize: '0.9rem'
                        }}>
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '2px solid #e0e0e0',
                                borderRadius: '10px',
                                fontSize: '1rem',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#2196F3';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e0e0e0';
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: '#ffebee',
                            color: '#c62828',
                            padding: '0.75rem',
                            borderRadius: '10px',
                            marginBottom: '1rem',
                            fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{
                            background: '#e8f5e9',
                            color: '#2e7d32',
                            padding: '0.75rem',
                            borderRadius: '10px',
                            marginBottom: '1rem',
                            fontSize: '0.9rem'
                        }}>
                            {success}
                        </div>
                    )}

                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'flex-end'
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'transparent',
                                border: '2px solid #e0e0e0',
                                borderRadius: '10px',
                                color: '#666',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = '#f5f5f5';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = 'transparent';
                            }}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                                border: 'none',
                                borderRadius: '10px',
                                color: 'white',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => {
                                if (!loading) {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 8px 25px rgba(33, 150, 243, 0.4)';
                                }
                            }}
                            onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            {loading ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function Header({ token, setToken }) {
    const [user, setUser] = useState(null);
    const [showLogin, setShowLogin] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [fullUserData, setFullUserData] = useState(null);

    // Функция для загрузки полных данных пользователя
    const loadFullUserData = async () => {
        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setFullUserData(data);
            }
        } catch (err) {
            console.error('Error loading user data:', err);
        }
    };

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const realmRoles = decoded.realm_access?.roles || [];
                const clientRoles = decoded.resource_access?.['react-app']?.roles || [];
                const rootRoles = decoded.roles || [];
                const allRoles = [...new Set([...realmRoles, ...clientRoles, ...rootRoles])];

                const userInfo = {
                    username: decoded.preferred_username || decoded.name || 'User',
                    email: decoded.email || '',
                    roles: allRoles
                };
                
                setUser(userInfo);
                
                // Загружаем полные данные пользователя
                loadFullUserData();
            } catch (err) {
                console.error('Token decode error:', err);
                localStorage.clear();
                setUser(null);
                setFullUserData(null);
            }
        } else {
            setUser(null);
            setFullUserData(null);
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

    const handleEditProfileSuccess = () => {
        // Обновляем данные пользователя после сохранения
        loadFullUserData();
        // Здесь можно также обновить данные в JWT, если сервер обновляет токен
        // или просто перезагрузить страницу для обновления данных
        window.location.reload();
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

                        {/* Кнопка редактирования профиля - для всех авторизованных */}
                        <button
                            onClick={() => setShowEditProfile(true)}
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
                                gap: '8px'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = 'rgba(76, 175, 80, 0.1)';
                                e.target.style.borderColor = '#4CAF50';
                                e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            <span>✏️</span> Редактировать профиль
                        </button>

                        {/* Кнопка личного кабинета - показываем только НЕ админам */}
                        {!isAdmin && (
                            <Link
                                to="/profile/applications"
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
                        )}

                        {/* Кнопка панели админа - показываем только админам */}
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
                        Войти / Регистрация
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

            {showEditProfile && (
                <EditProfileModal
                    user={fullUserData || user}
                    token={token}
                    onClose={() => setShowEditProfile(false)}
                    onSuccess={handleEditProfileSuccess}
                />
            )}
        </header>
    );
}