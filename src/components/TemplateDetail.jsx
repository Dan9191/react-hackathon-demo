import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getConfig } from '../config';
import OrderModal from './OrderModal';
import { jwtDecode } from 'jwt-decode';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

export default function TemplateDetail({ token, setToken }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const roles = decoded.roles || [];
                setIsAdmin(roles.includes('ROLE_hackathon.admin') || roles.includes('ROLE_hackathon.manager'));
            } catch (err) {
                console.error('Ошибка декодирования токена:', err);
            }
        }

        const { API_BASE_URL } = getConfig();
        fetch(`${API_BASE_URL}/api/templates/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => {
                setTemplate(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError('Не удалось загрузить информацию о шаблоне');
                setLoading(false);
            });
    }, [id, token]);

    const handleOrderClick = () => {
        if (!token) {
            alert('Для оформления заказа необходимо авторизоваться');
            return;
        }

        if (isAdmin) {
            alert('Администраторы не могут оформлять заказы. Для заказа войдите под обычным пользователем.');
            return;
        }

        setShowOrderModal(true);
    };

    if (loading) return (
        <div style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem'
        }}>
            <div style={{
                width: '60px',
                height: '60px',
                border: '4px solid #e3f2fd',
                borderTopColor: '#2196F3',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '1.5rem'
            }}></div>
            <h3 style={{ color: '#1a237e', marginBottom: '0.5rem' }}>Загружаем информацию...</h3>
            <p style={{ color: '#546e7a' }}>Пожалуйста, подождите</p>
        </div>
    );

    if (error) return (
        <div style={{
            maxWidth: '600px',
            margin: '3rem auto',
            padding: '3rem',
            textAlign: 'center',
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)'
        }}>
            <div style={{
                fontSize: '5rem',
                marginBottom: '1.5rem',
                color: '#ff9800'
            }}>⚠️</div>
            <h2 style={{ color: '#1a237e', marginBottom: '1rem', fontSize: '1.8rem' }}>Ошибка загрузки</h2>
            <p style={{ color: '#546e7a', marginBottom: '2rem', fontSize: '1.1rem' }}>{error}</p>
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: 'inline-block',
                    padding: '14px 32px',
                    background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(33, 150, 243, 0.3)';
                }}
                onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                }}
            >
                ← Назад
            </button>
        </div>
    );

    if (!template) return (
        <div style={{
            maxWidth: '600px',
            margin: '3rem auto',
            padding: '3rem',
            textAlign: 'center',
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)'
        }}>
            <div style={{
                fontSize: '5rem',
                marginBottom: '1.5rem',
                color: '#f44336'
            }}>❌</div>
            <h2 style={{ color: '#1a237e', marginBottom: '1rem', fontSize: '1.8rem' }}>Шаблон не найден</h2>
            <p style={{ color: '#546e7a', marginBottom: '2rem', fontSize: '1.1rem' }}>
                Запрашиваемый шаблон не существует или был удален
            </p>
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: 'inline-block',
                    padding: '14px 32px',
                    background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(33, 150, 243, 0.3)';
                }}
                onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                }}
            >
                ← Назад
            </button>
        </div>
    );

    // Собираем все изображения для просмотра (preview + gallery)
    const images = template.files
        ?.filter(f => f.fileRole === 'preview' || f.fileRole === 'gallery')
        ?.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) || [];

    const mainImage = images[0];
    const thumbnails = images.slice(1);

    const documents = template.files?.filter(f => f.fileRole === 'document') || [];

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '2rem 1rem',
            minHeight: '100vh'
        }}>
            {/* Хлебные крошки */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '2rem',
                fontSize: '0.95rem'
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        color: '#2196F3',
                        background: 'none',
                        border: 'none',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        padding: 0
                    }}
                >
                    <span style={{ fontSize: '1.2rem' }}>←</span> Назад
                </button>
                <span style={{ color: '#999' }}>/</span>
                <span style={{ color: '#546e7a' }}>{template.title}</span>
            </div>

            {/* Основной контейнер с фоном и скругленными углами */}
            <div style={{
                background: 'white',
                borderRadius: '24px',
                boxShadow: '0 10px 50px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
                marginBottom: '2rem'
            }}>
                {/* Верхняя часть с фото и информацией */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '3rem',
                    padding: '3rem'
                }}>
                    {/* Левая колонка - изображения и документы */}
                    <div>
                        <PhotoProvider
                            overlayColor="rgba(0,0,0,0.92)"
                            speed={() => 600}
                            brokenElement={<div style={{ color: '#fff' }}>Изображение не загрузилось</div>}
                        >
                            {/* Главное изображение */}
                            {mainImage ? (
                                <PhotoView src={mainImage.url}>
                                    <div style={{
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                        cursor: 'pointer',
                                        marginBottom: '1.5rem',
                                        transition: 'transform 0.3s ease'
                                    }}
                                         onMouseOver={e => e.currentTarget.style.transform = 'scale(1.015)'}
                                         onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <img
                                            src={mainImage.url}
                                            alt={template.title}
                                            style={{
                                                width: '100%',
                                                height: '400px',
                                                objectFit: 'cover',
                                                display: 'block'
                                            }}
                                        />
                                    </div>
                                </PhotoView>
                            ) : (
                                <div style={{
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                    height: '400px',
                                    background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '2.5rem'
                                }}>
                                    <div style={{ textAlign: 'center', color: '#2196F3' }}>
                                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏠</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Изображение отсутствует</div>
                                    </div>
                                </div>
                            )}

                            {/* Галерея миниатюр */}
                            {thumbnails.length > 0 && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: '1rem',
                                    marginBottom: '2.5rem'
                                }}>
                                    {thumbnails.map((file) => (
                                        <PhotoView key={file.id} src={file.url}>
                                            <div style={{
                                                borderRadius: '12px',
                                                overflow: 'hidden',
                                                height: '100px',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                transition: 'all 0.3s ease'
                                            }}
                                                 onMouseOver={e => {
                                                     e.currentTarget.style.transform = 'scale(1.06)';
                                                     e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.25)';
                                                 }}
                                                 onMouseOut={e => {
                                                     e.currentTarget.style.transform = 'scale(1)';
                                                     e.currentTarget.style.boxShadow = 'none';
                                                 }}
                                            >
                                                <img
                                                    src={file.url}
                                                    alt={`${template.title} - фото`}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            </div>
                                        </PhotoView>
                                    ))}
                                </div>
                            )}
                        </PhotoProvider>

                        {/* Секция с документами в левой колонке */}
                        <div>
                            <h3 style={{
                                color: '#1a237e',
                                margin: '0 0 1.5rem 0',
                                fontSize: '1.4rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span>📄</span> Документы проекта
                            </h3>

                            {documents.length > 0 ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem'
                                }}>
                                    {documents.map(file => (
                                        <a
                                            key={file.id}
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                padding: '1.2rem 1.5rem',
                                                background: '#f8f9fa',
                                                borderRadius: '12px',
                                                textDecoration: 'none',
                                                color: 'inherit',
                                                transition: 'all 0.3s ease',
                                                border: '1px solid #e0e0e0'
                                            }}
                                            onMouseOver={(e) => {
                                                e.target.style.background = '#e3f2fd';
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                                e.target.style.borderColor = '#bbdefb';
                                            }}
                                            onMouseOut={(e) => {
                                                e.target.style.background = '#f8f9fa';
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = 'none';
                                                e.target.style.borderColor = '#e0e0e0';
                                            }}
                                        >
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                background: '#2196F3',
                                                borderRadius: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '1.4rem',
                                                flexShrink: 0
                                            }}>
                                                {file.filename.endsWith('.pdf') ? '📄' : '📋'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    color: '#1a237e',
                                                    fontWeight: 600,
                                                    marginBottom: '4px',
                                                    fontSize: '1rem'
                                                }}>
                                                    {file.filename}
                                                </div>
                                                <div style={{
                                                    color: '#666',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {file.filename.endsWith('.pdf') ? 'PDF документ' : 'Документ'}
                                                    {file.fileSize && (
                                                        <span style={{ marginLeft: '1rem' }}>
                                                            {(file.fileSize / 1024).toFixed(1)} KB
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{
                                                color: '#2196F3',
                                                fontSize: '1.1rem',
                                                fontWeight: 600,
                                                opacity: 0.8
                                            }}>
                                                →
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '2.5rem 1.5rem',
                                    background: '#f8f9fa',
                                    borderRadius: '12px',
                                    border: '2px dashed #e0e0e0'
                                }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        marginBottom: '1rem',
                                        color: '#bdbdbd'
                                    }}>📭</div>
                                    <h4 style={{
                                        color: '#666',
                                        margin: '0 0 0.5rem 0',
                                        fontSize: '1.1rem'
                                    }}>
                                        Документы отсутствуют
                                    </h4>
                                    <p style={{
                                        color: '#999',
                                        fontSize: '0.9rem',
                                        lineHeight: 1.5
                                    }}>
                                        Для этого проекта пока не загружены документы.
                                        Документация будет доступна после согласования проекта.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Правая колонка - информация о проекте */}
                    <div>
                        <h1 style={{
                            fontSize: '2.5rem',
                            color: '#1a237e',
                            margin: '0 0 1rem 0',
                            fontWeight: 700,
                            lineHeight: 1.2
                        }}>{template.title}</h1>

                        {template.description && (
                            <div style={{
                                color: '#546e7a',
                                fontSize: '1.1rem',
                                lineHeight: 1.6,
                                marginBottom: '2rem',
                                padding: '1.5rem',
                                background: '#f8f9fa',
                                borderRadius: '12px'
                            }}>
                                {template.description}
                            </div>
                        )}

                        {/* Характеристики */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '16px',
                            padding: '2rem',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                            marginBottom: '2rem',
                            border: '1px solid #e3f2fd'
                        }}>
                            <h3 style={{
                                color: '#1a237e',
                                margin: '0 0 1.5rem 0',
                                fontSize: '1.3rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span>📊</span> Основные характеристики
                            </h3>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '1.5rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        background: '#e3f2fd',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.3rem'
                                    }}>🎨</div>
                                    <div>
                                        <div style={{ color: '#666', fontSize: '0.9rem' }}>Стиль</div>
                                        <div style={{ color: '#1a237e', fontWeight: 600, fontSize: '1.1rem' }}>
                                            {template.style || 'Не указан'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        background: '#e8f5e9',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.3rem'
                                    }}>📏</div>
                                    <div>
                                        <div style={{ color: '#666', fontSize: '0.9rem' }}>Площадь</div>
                                        <div style={{ color: '#1a237e', fontWeight: 600, fontSize: '1.1rem' }}>
                                            {template.areaM2} м²
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        background: '#fff3e0',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.3rem'
                                    }}>🚪</div>
                                    <div>
                                        <div style={{ color: '#666', fontSize: '0.9rem' }}>Комнаты</div>
                                        <div style={{ color: '#1a237e', fontWeight: 600, fontSize: '1.1rem' }}>
                                            {template.rooms}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        background: '#fce4ec',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.3rem'
                                    }}>💰</div>
                                    <div>
                                        <div style={{ color: '#666', fontSize: '0.9rem' }}>Базовая цена</div>
                                        <div style={{ color: '#1a237e', fontWeight: 600, fontSize: '1.1rem' }}>
                                            {Number(template.basePrice).toLocaleString('ru-RU')} ₽
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                marginTop: '1.5rem',
                                paddingTop: '1.5rem',
                                borderTop: '1px solid #e0e0e0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        background: template.isActive ? '#4CAF50' : '#FF9800'
                                    }}></span>
                                    <span style={{ color: '#666' }}>
                                        Статус: <strong>{template.isActive ? 'Активен' : 'Неактивен'}</strong>
                                    </span>
                                </div>
                                <span style={{
                                    padding: '6px 16px',
                                    background: template.isActive ? '#e8f5e9' : '#fff3e0',
                                    color: template.isActive ? '#2e7d32' : '#ef6c00',
                                    borderRadius: '20px',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    border: `1px solid ${template.isActive ? '#c8e6c9' : '#ffccbc'}`
                                }}>
                                    {template.isActive ? 'Доступен для заказа' : 'Временно недоступен'}
                                </span>
                            </div>
                        </div>

                        {/* Кнопка заказа */}
                        <div style={{
                            background: '#f8f9fa',
                            borderRadius: '16px',
                            padding: '2rem',
                            textAlign: 'center',
                            border: '2px solid #bbdefb'
                        }}>
                            <h3 style={{
                                color: '#1a237e',
                                margin: '0 0 1rem 0',
                                fontSize: '1.4rem'
                            }}>🏡 Заинтересовал этот проект?</h3>

                            <p style={{
                                color: '#546e7a',
                                marginBottom: '1.5rem',
                                fontSize: '1.05rem',
                                lineHeight: 1.5
                            }}>
                                Оформите заявку на строительство дома по этому проекту. Наш менеджер свяжется с вами для уточнения деталей.
                            </p>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                alignItems: 'center'
                            }}>
                                <button
                                    onClick={handleOrderClick}
                                    disabled={!template.isActive || isAdmin}
                                    style={{
                                        padding: '18px 48px',
                                        fontSize: '1.2rem',
                                        fontWeight: 700,
                                        background: !token ? '#FF9800' :
                                            isAdmin ? '#9C27B0' :
                                                !template.isActive ? '#9E9E9E' :
                                                    '#4CAF50',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: !template.isActive || isAdmin ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s ease',
                                        opacity: !template.isActive || isAdmin ? 0.6 : 1,
                                        minWidth: '280px',
                                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                    }}
                                    onMouseOver={(e) => {
                                        if (template.isActive && !isAdmin && token) {
                                            e.target.style.transform = 'translateY(-3px)';
                                            e.target.style.boxShadow = '0 10px 25px rgba(76, 175, 80, 0.3)';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (template.isActive && !isAdmin && token) {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
                                        }
                                    }}
                                >
                                    {!token ? 'Войти для оформления заказа' :
                                        isAdmin ? '👑 Администратор' :
                                            !template.isActive ? 'Проект недоступен' :
                                                'Оформить заказ'}
                                </button>

                                {!token ? (
                                    <p style={{ color: '#666', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                                        После авторизации вы сможете оформить заказ
                                    </p>
                                ) : isAdmin ? (
                                    <p style={{ color: '#9C27B0', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                                        ⚠️ Администраторы не могут оформлять заказы
                                    </p>
                                ) : !template.isActive ? (
                                    <p style={{ color: '#ef6c00', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                                        ⏸️ Этот проект временно недоступен для заказа
                                    </p>
                                ) : (
                                    <p style={{ color: '#2E7D32', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                                        ✅ Вы можете оформить заказ на этот проект
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Модальное окно заказа */}
            {showOrderModal && token && !isAdmin && template.isActive && (
                <OrderModal
                    token={token}
                    templateId={template.id}
                    templateTitle={template.title}
                    onClose={() => setShowOrderModal(false)}
                    onSuccess={() => {
                        setShowOrderModal(false);
                        alert('Заказ успешно создан! С вами свяжется наш менеджер.');
                    }}
                />
            )}

            <style jsx="true">{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}