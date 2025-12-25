import React, { useState } from 'react';
import { getAuthConfig, getConfig } from '../auth-config';

export default function LoginModal({ onClose, onSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { KEYCLOAK_URL, REALM, CLIENT_ID } = getAuthConfig();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!isLogin) {
            // Валидация для регистрации
            if (password !== confirmPassword) {
                setError('Пароли не совпадают');
                return;
            }
            if (password.length < 6) {
                setError('Пароль должен быть не менее 6 символов');
                return;
            }
            if (!email.includes('@')) {
                setError('Введите корректный email');
                return;
            }
            if (!username.trim()) {
                setError('Введите логин');
                return;
            }
        }

        setLoading(true);

        if (isLogin) {
            // Логин (остается прежним)
            const body = new URLSearchParams({
                grant_type: 'password',
                client_id: CLIENT_ID,
                username,
                password,
            });

            try {
                const res = await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body,
                });

                if (!res.ok) {
                    const text = await res.text();
                    const msg = text.includes('invalid_grant') ? 'Неверный логин или пароль' : 'Ошибка сервера';
                    throw new Error(msg);
                }

                const data = await res.json();
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);
                localStorage.setItem('token_expires_at', Date.now() + data.expires_in * 1000);
                onSuccess();
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        } else {
            // Регистрация через /api/auth/register
            try {
                const { API_BASE_URL } = getConfig();
                const registerData = {
                    username: username.trim(),
                    email: email.trim(),
                    password: password,
                    firstName: firstName.trim() || username.trim(),
                    lastName: lastName.trim() || username.trim()
                };

                const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(registerData),
                });

                if (!response.ok) {
                    const text = await response.text();
                    let errorMessage = 'Ошибка регистрации';

                    try {
                        const errorData = JSON.parse(text);
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    } catch {
                        if (text.includes('already exists') || text.includes('уже существует')) {
                            errorMessage = 'Пользователь с таким логином или email уже существует';
                        } else if (text.includes('Invalid email')) {
                            errorMessage = 'Некорректный email адрес';
                        } else if (text.includes('weak password')) {
                            errorMessage = 'Пароль слишком слабый';
                        } else if (text) {
                            errorMessage = text;
                        }
                    }

                    throw new Error(errorMessage);
                }

                const data = await response.json();

                // После успешной регистрации автоматически входим
                setSuccessMessage('Регистрация успешна! Выполняется вход...');

                // Автоматический вход после регистрации
                setTimeout(async () => {
                    try {
                        const loginBody = new URLSearchParams({
                            grant_type: 'password',
                            client_id: CLIENT_ID,
                            username: registerData.username,
                            password: registerData.password,
                        });

                        const loginRes = await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: loginBody,
                        });

                        if (loginRes.ok) {
                            const loginData = await loginRes.json();
                            localStorage.setItem('access_token', loginData.access_token);
                            localStorage.setItem('refresh_token', loginData.refresh_token);
                            localStorage.setItem('token_expires_at', Date.now() + loginData.expires_in * 1000);
                            onSuccess();
                        } else {
                            setError('Регистрация прошла успешно, но не удалось выполнить автоматический вход. Войдите вручную.');
                            setIsLogin(true);
                        }
                    } catch (loginErr) {
                        setError('Регистрация прошла успешно, но не удалось выполнить автоматический вход. Войдите вручную.');
                        setIsLogin(true);
                    }
                }, 1500);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setSuccessMessage('');
        setPassword('');
        setConfirmPassword('');
        setFirstName('');
        setLastName('');
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(6px)'
        }} onClick={onClose}>
            <div style={{
                background: 'linear-gradient(145deg, #ffffff, #f5f9ff)',
                borderRadius: '24px',
                padding: '2.5rem',
                width: '90%',
                maxWidth: isLogin ? '450px' : '500px',
                boxShadow: '0 25px 70px rgba(0, 0, 0, 0.35)',
                position: 'relative',
                borderTop: `6px solid ${isLogin ? '#2196F3' : '#4CAF50'}`,
                animation: 'modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }} onClick={e => e.stopPropagation()}>

                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#f5f5f5',
                        border: 'none',
                        fontSize: '24px',
                        color: '#666',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        padding: 0,
                        lineHeight: 1
                    }}
                    onMouseOver={(e) => {
                        e.target.style.background = '#ff4444';
                        e.target.style.color = 'white';
                        e.target.style.transform = 'rotate(90deg)';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.background = '#f5f5f5';
                        e.target.style.color = '#666';
                        e.target.style.transform = 'rotate(0deg)';
                    }}
                >
                    ×
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{
                        margin: '0 0 0.5rem',
                        color: isLogin ? '#2196F3' : '#4CAF50',
                        fontSize: '2rem',
                        fontWeight: 700
                    }}>
                        {isLogin ? 'Вход в систему' : 'Регистрация'}
                    </h2>
                    <p style={{
                        color: '#666',
                        marginTop: '0.5rem',
                        fontSize: '0.95rem',
                        opacity: 0.9
                    }}>
                        {isLogin ? 'Введите ваши данные для входа' : 'Заполните форму для создания аккаунта'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.2rem'
                }}>
                    {/* Общие поля для входа и регистрации */}
                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: 600,
                            color: '#333'
                        }}>
                            {isLogin ? 'Логин или Email *' : 'Логин *'}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: isLogin ? '#2196F3' : '#4CAF50',
                                fontSize: '1.2rem'
                            }}>👤</span>
                            <input
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 16px 14px 50px',
                                    border: '2px solid #e3f2fd',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    background: '#fafcff',
                                    transition: 'all 0.3s ease',
                                    boxSizing: 'border-box'
                                }}
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder={isLogin ? "Введите логин или email" : "Придумайте логин"}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Поля только для регистрации */}
                    {!isLogin && (
                        <>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '1rem'
                            }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '0.5rem',
                                        fontWeight: 600,
                                        color: '#333'
                                    }}>Имя</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{
                                            position: 'absolute',
                                            left: '16px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: '#4CAF50',
                                            fontSize: '1.2rem'
                                        }}>👨</span>
                                        <input
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px 14px 50px',
                                                border: '2px solid #e3f2fd',
                                                borderRadius: '12px',
                                                fontSize: '1rem',
                                                background: '#fafcff',
                                                transition: 'all 0.3s ease',
                                                boxSizing: 'border-box'
                                            }}
                                            value={firstName}
                                            onChange={e => setFirstName(e.target.value)}
                                            placeholder="Иван"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '0.5rem',
                                        fontWeight: 600,
                                        color: '#333'
                                    }}>Фамилия</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{
                                            position: 'absolute',
                                            left: '16px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: '#4CAF50',
                                            fontSize: '1.2rem'
                                        }}>👨</span>
                                        <input
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px 14px 50px',
                                                border: '2px solid #e3f2fd',
                                                borderRadius: '12px',
                                                fontSize: '1rem',
                                                background: '#fafcff',
                                                transition: 'all 0.3s ease',
                                                boxSizing: 'border-box'
                                            }}
                                            value={lastName}
                                            onChange={e => setLastName(e.target.value)}
                                            placeholder="Иванов"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontWeight: 600,
                                    color: '#333'
                                }}>Email *</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{
                                        position: 'absolute',
                                        left: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#4CAF50',
                                        fontSize: '1.2rem'
                                    }}>✉️</span>
                                    <input
                                        required
                                        type="email"
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px 14px 50px',
                                            border: '2px solid #e3f2fd',
                                            borderRadius: '12px',
                                            fontSize: '1rem',
                                            background: '#fafcff',
                                            transition: 'all 0.3s ease',
                                            boxSizing: 'border-box'
                                        }}
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="ivan@example.com"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: 600,
                            color: '#333'
                        }}>Пароль *</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: isLogin ? '#2196F3' : '#4CAF50',
                                fontSize: '1.2rem'
                            }}>🔒</span>
                            <input
                                required
                                type={showPassword ? "text" : "password"}
                                style={{
                                    width: '100%',
                                    padding: '14px 16px 14px 50px',
                                    border: '2px solid #e3f2fd',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    background: '#fafcff',
                                    transition: 'all 0.3s ease',
                                    boxSizing: 'border-box'
                                }}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder={isLogin ? "Введите пароль" : "Придумайте пароль"}
                            />
                            <button
                                type="button"
                                style={{
                                    position: 'absolute',
                                    right: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.2rem',
                                    cursor: 'pointer',
                                    color: '#666',
                                    padding: '5px',
                                    transition: 'color 0.2s'
                                }}
                                onClick={() => setShowPassword(!showPassword)}
                                onMouseOver={(e) => e.target.style.color = isLogin ? '#2196F3' : '#4CAF50'}
                                onMouseOut={(e) => e.target.style.color = '#666'}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                        {!isLogin && (
                            <p style={{
                                fontSize: '0.85rem',
                                color: '#666',
                                marginTop: '0.5rem',
                                paddingLeft: '10px'
                            }}>
                                💡 Пароль должен быть не менее 6 символов
                            </p>
                        )}
                    </div>

                    {!isLogin && (
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontWeight: 600,
                                color: '#333'
                            }}>Подтверждение пароля *</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{
                                    position: 'absolute',
                                    left: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#4CAF50',
                                    fontSize: '1.2rem'
                                }}>🔒</span>
                                <input
                                    required
                                    type={showConfirmPassword ? "text" : "password"}
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px 14px 50px',
                                        border: '2px solid #e3f2fd',
                                        borderRadius: '12px',
                                        fontSize: '1rem',
                                        background: '#fafcff',
                                        transition: 'all 0.3s ease',
                                        boxSizing: 'border-box'
                                    }}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Повторите пароль"
                                />
                                <button
                                    type="button"
                                    style={{
                                        position: 'absolute',
                                        right: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '1.2rem',
                                        cursor: 'pointer',
                                        color: '#666',
                                        padding: '5px',
                                        transition: 'color 0.2s'
                                    }}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    onMouseOver={(e) => e.target.style.color = '#4CAF50'}
                                    onMouseOut={(e) => e.target.style.color = '#666'}
                                >
                                    {showConfirmPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            background: '#ffebee',
                            border: '1px solid #ffcdd2',
                            color: '#d32f2f',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '0.9rem',
                            animation: 'slideDown 0.3s ease'
                        }}>
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            background: '#e8f5e9',
                            border: '1px solid #c8e6c9',
                            color: '#2e7d32',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '0.9rem',
                            animation: 'slideDown 0.3s ease'
                        }}>
                            <span>✅</span>
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {isLogin && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            margin: '0.5rem 0'
                        }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                color: '#555'
                            }}>
                                <input type="checkbox" style={{
                                    width: '18px',
                                    height: '18px',
                                    border: '2px solid #90caf9',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }} />
                                <span>Запомнить меня</span>
                            </label>
                            <button
                                type="button"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#2196F3',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    padding: 0,
                                    textDecoration: 'underline',
                                    transition: 'color 0.2s'
                                }}
                                onClick={() => setError('Функция восстановления пароля временно недоступна')}
                                onMouseOver={(e) => e.target.style.color = '#0d47a1'}
                                onMouseOut={(e) => e.target.style.color = '#2196F3'}
                            >
                                Забыли пароль?
                            </button>
                        </div>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                background: `linear-gradient(135deg, ${isLogin ? '#2196F3' : '#4CAF50'}, ${isLogin ? '#21CBF3' : '#2E7D32'})`,
                                border: 'none',
                                color: 'white',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden',
                                opacity: loading ? 0.7 : 1
                            }}
                            onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
                            onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
                        >
                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}>
                                {loading ? (
                                    <>
                                        <span style={{
                                            width: '18px',
                                            height: '18px',
                                            border: '2px solid rgba(255, 255, 255, 0.3)',
                                            borderRadius: '50%',
                                            borderTopColor: 'white',
                                            animation: 'spin 1s ease-in-out infinite'
                                        }}></span>
                                        {isLogin ? 'Входим...' : 'Регистрируем...'}
                                    </>
                                ) : (
                                    <>
                                        {isLogin ? 'Войти' : 'Зарегистрироваться'}
                                    </>
                                )}
                            </span>
                        </button>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        margin: '1.5rem 0',
                        color: '#999'
                    }}>
                        <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></div>
                        <span style={{ padding: '0 15px', fontSize: '0.85rem', background: 'white' }}>или</span>
                        <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></div>
                    </div>

                    <div style={{ textAlign: 'center', color: '#666', fontSize: '0.95rem' }}>
                        <p>
                            {isLogin ? 'Ещё нет аккаунта?' : 'Уже есть аккаунт?'}
                            <button
                                type="button"
                                onClick={toggleMode}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: isLogin ? '#2196F3' : '#4CAF50',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    padding: '0 5px',
                                    textDecoration: 'underline',
                                    transition: 'color 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.color = isLogin ? '#0d47a1' : '#2E7D32'}
                                onMouseOut={(e) => e.target.style.color = isLogin ? '#2196F3' : '#4CAF50'}
                            >
                                {isLogin ? ' Зарегистрироваться' : ' Войти'}
                            </button>
                        </p>
                    </div>

                    <div style={{
                        marginTop: '1.5rem',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid #f0f0f0'
                    }}>
                        <p style={{
                            fontSize: '0.8rem',
                            color: '#888',
                            textAlign: 'center',
                            lineHeight: 1.4
                        }}>
                            Нажимая кнопку, вы соглашаетесь с
                            <a href="#" onClick={(e) => { e.preventDefault(); alert('Политика конфиденциальности'); }}
                                style={{ color: isLogin ? '#2196F3' : '#4CAF50', textDecoration: 'none' }}
                                onMouseOver={(e) => {
                                    e.target.style.color = isLogin ? '#0d47a1' : '#2E7D32';
                                    e.target.style.textDecoration = 'underline';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.color = isLogin ? '#2196F3' : '#4CAF50';
                                    e.target.style.textDecoration = 'none';
                                }}>
                                {' политикой конфиденциальности '}
                            </a>
                            и
                            <a href="#" onClick={(e) => { e.preventDefault(); alert('Условия использования'); }}
                                style={{ color: isLogin ? '#2196F3' : '#4CAF50', textDecoration: 'none' }}
                                onMouseOver={(e) => {
                                    e.target.style.color = isLogin ? '#0d47a1' : '#2E7D32';
                                    e.target.style.textDecoration = 'underline';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.color = isLogin ? '#2196F3' : '#4CAF50';
                                    e.target.style.textDecoration = 'none';
                                }}>
                                {' условиями использования'}
                            </a>
                        </p>
                    </div>
                </form>
            </div>

            <style jsx="true">{`
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(30px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}