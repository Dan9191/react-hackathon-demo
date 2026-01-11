import React, { useEffect, useState } from 'react';
import { getConfig } from '../config';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import EditTemplateModal from './EditTemplateModal';
import CreateTemplateModal from './CreateTemplateModal';

export default function PublicContent({ token }) {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [deletingTemplateId, setDeletingTemplateId] = useState(null);

    useEffect(() => {
        // Проверяем права пользователя
        let userIsAdmin = false;
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const roles = decoded.roles || [];
                userIsAdmin = roles.includes('ROLE_hackathon.admin') || roles.includes('ROLE_hackathon.manager');
                setIsAdmin(userIsAdmin);
            } catch (err) {
                console.error('Ошибка декодирования токена:', err);
            }
        }

        loadTemplates(userIsAdmin);
    }, [token]);

    const loadTemplates = (adminStatus) => {
        setLoading(true);
        setError('');
        const { API_BASE_URL } = getConfig();

        // Выбираем правильный эндпоинт в зависимости от прав
        const endpoint = adminStatus
            ? '/api/templates/all'  // Для админов - все шаблоны
            : '/api/templates';     // Для пользователей - только активные

        fetch(`${API_BASE_URL}${endpoint}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
                return r.json();
            })
            .then(data => {
                // Обрабатываем данные в зависимости от структуры ответа
                let templatesData = [];

                if (Array.isArray(data)) {
                    templatesData = data;
                } else if (data.content && Array.isArray(data.content)) {
                    templatesData = data.content;
                } else if (data._embedded && data._embedded.templates) {
                    templatesData = data._embedded.templates;
                } else {
                    console.warn('Неожиданная структура данных:', data);
                    templatesData = [];
                }

                setTemplates(templatesData);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load templates:', err);
                setError('Не удалось загрузить шаблоны. Пожалуйста, попробуйте позже.');
                setLoading(false);
            });
    };

    const handleDeleteClick = (e, templateId) => {
        e.preventDefault();
        e.stopPropagation();
        handleDelete(templateId);
    };

    const handleOrderClick = (e, templateId) => {
        e.preventDefault();
        e.stopPropagation();

        if (!token) {
            alert('Для оформления заказа необходимо авторизоваться');
            return;
        }

        // Перенаправляем на страницу деталей шаблона
        window.location.href = `/template/${templateId}`;
    };

    const handleEditClick = (e, template) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingTemplate(template);
        setShowEditModal(true);
    };

    const handleUpdateSuccess = (updatedTemplate) => {
        // Обновляем шаблон в списке
        setTemplates(templates.map(t =>
            t.id === updatedTemplate.id ? updatedTemplate : t
        ));
        setShowEditModal(false);
    };

    const handleDelete = async (templateId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот шаблон?\nЭто действие нельзя отменить.')) {
            return;
        }

        setDeletingTemplateId(templateId);
        const { API_BASE_URL } = getConfig();

        try {
            const res = await fetch(`${API_BASE_URL}/api/templates/${templateId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            if (!res.ok) {
                throw new Error(`Ошибка удаления: ${res.status}`);
            }

            alert('Шаблон успешно удален!');

            setTemplates(templates.filter(t => t.id !== templateId));
        } catch (err) {
            console.error('Ошибка удаления шаблона:', err);
            alert('Ошибка удаления шаблона: ' + err.message);
        } finally {
            setDeletingTemplateId(null);
        }
    };

    const handleCreateSuccess = (newTemplate) => {
        // Добавляем новый шаблон в список и перезагружаем данные
        loadTemplates(isAdmin);
        setShowCreateModal(false);
    };

    const handleRefresh = () => {
        loadTemplates(isAdmin);
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
            <h3 style={{ color: '#1a237e', marginBottom: '0.5rem' }}>Загружаем шаблоны...</h3>
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
                onClick={handleRefresh}
                style={{
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
                Попробовать снова
            </button>
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>

            {templates.length === 0 ? (
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
                        color: isAdmin ? '#2196F3' : '#4CAF50'
                    }}>🏠</div>
                    <h2 style={{
                        color: '#1a237e',
                        marginBottom: '1rem',
                        fontSize: '1.8rem'
                    }}>
                        {isAdmin ? 'Нет шаблонов' : 'Нет доступных шаблонов'}
                    </h2>
                    <p style={{
                        color: '#546e7a',
                        marginBottom: isAdmin ? '1rem' : '2rem',
                        fontSize: '1.1rem'
                    }}>
                        {isAdmin
                            ? 'Начните с создания первого шаблона дома'
                            : 'В данный момент нет активных шаблонов домов для заказа'}
                    </p>

                    {isAdmin && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            style={{
                                padding: '14px 32px',
                                background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 600,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                marginTop: '1rem'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.3)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            ➕ Создать первый шаблон
                        </button>
                    )}
                </div>
            ) : (

                <>
                    <div style={{
                        textAlign: 'center',
                        margin: '3rem 0',
                        animation: 'fadeIn 0.5s ease'
                    }}>
                        <h1 style={{
                            fontSize: '2.5rem',
                            color: '#1a237e',
                            marginBottom: '1rem',
                            fontWeight: 700
                        }}>
                            {isAdmin ? '👑 Управление шаблонами' : '🏡 Каталог домов'}
                        </h1>
                        <p style={{
                            fontSize: '1.1rem',
                            color: '#546e7a',
                            maxWidth: '600px',
                            margin: '0 auto'
                        }}>
                            {isAdmin
                                ? 'Редактируйте существующие шаблоны и создавайте новые'
                                : 'Выберите проект вашего будущего дома из нашей коллекции готовых шаблонов'}
                        </p>

                {isAdmin && (
                    <div style={{
                        marginTop: '1.5rem',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: 600,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.3)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            ➕ Создать шаблон
                        </button>

                        <button
                            onClick={handleRefresh}
                            style={{
                                padding: '12px 24px',
                                background: 'transparent',
                                color: '#2196F3',
                                border: '2px solid #2196F3',
                                borderRadius: '10px',
                                fontWeight: 600,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = '#e3f2fd';
                                e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            🔄 Обновить список
                        </button>
                    </div>
                )}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '2rem',
                padding: '1rem 0'
            }}>
                {templates.map(t => {
                    // Находим превью изображение
                    const previewFile = t.files?.find(f =>
                        f.fileRole === 'preview' ||
                        (f.fileRole === 'gallery' && t.previewUrl?.includes(f.id?.toString()))
                    );

                    const previewUrl = previewFile?.url || t.previewUrl;

                    return (
                        <div key={t.id} style={{
                            background: 'white',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-8px)';
                                e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.12)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.08)';
                            }}>
                            <Link to={`/template/${t.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                                <div style={{ height: '200px', overflow: 'hidden' }}>
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt={t.title}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.5s ease'
                                            }}
                                            onMouseOver={(e) => {
                                                e.target.style.transform = 'scale(1.05)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.target.style.transform = 'scale(1)';
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#2196F3',
                                            fontSize: '1.2rem'
                                        }}>
                                            🏠 Нет фото
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '1.5rem' }}>
                                    <h3 style={{
                                        margin: '0 0 1rem 0',
                                        color: '#1a237e',
                                        fontSize: '1.3rem',
                                        fontWeight: 600
                                    }}>
                                        {t.title}
                                    </h3>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '0.75rem',
                                        marginBottom: '1rem'
                                    }}>
                                        <div>
                                            <div style={{
                                                color: '#666',
                                                fontSize: '0.85rem',
                                                marginBottom: '2px'
                                            }}>🎨 Стиль</div>
                                            <div style={{
                                                color: '#1a237e',
                                                fontWeight: 500,
                                                fontSize: '0.95rem'
                                            }}>
                                                {t.style || 'Не указан'}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{
                                                color: '#666',
                                                fontSize: '0.85rem',
                                                marginBottom: '2px'
                                            }}>📏 Площадь</div>
                                            <div style={{
                                                color: '#1a237e',
                                                fontWeight: 500,
                                                fontSize: '0.95rem'
                                            }}>
                                                {t.areaM2} м²
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{
                                                color: '#666',
                                                fontSize: '0.85rem',
                                                marginBottom: '2px'
                                            }}>🚪 Комнаты</div>
                                            <div style={{
                                                color: '#1a237e',
                                                fontWeight: 500,
                                                fontSize: '0.95rem'
                                            }}>
                                                {t.rooms}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{
                                                color: '#666',
                                                fontSize: '0.85rem',
                                                marginBottom: '2px'
                                            }}>💰 Цена</div>
                                            <div style={{
                                                color: '#1a237e',
                                                fontWeight: 600,
                                                fontSize: '1rem'
                                            }}>
                                                {Number(t.basePrice).toLocaleString('ru-RU')} ₽
                                            </div>
                                        </div>
                                    </div>

                                    {isAdmin && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.5rem 0',
                                            marginTop: '0.5rem',
                                            borderTop: '1px solid #e0e0e0'
                                        }}>
                                            <span style={{
                                                color: t.isActive ? '#2E7D32' : '#F57C00',
                                                fontWeight: 600,
                                                fontSize: '0.9rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px'
                                            }}>
                                                <span>{t.isActive ? '✅' : '⏸️'}</span>
                                                {t.isActive ? 'Активен' : 'Неактивен'}
                                            </span>

                                            <span style={{
                                                fontSize: '0.8rem',
                                                color: '#666',
                                                background: t.isActive ? '#e8f5e9' : '#fff3e0',
                                                padding: '2px 8px',
                                                borderRadius: '10px',
                                                border: `1px solid ${t.isActive ? '#c8e6c9' : '#ffccbc'}`
                                            }}>
                                                {t.isActive ? 'Доступен для заказа' : 'Скрыт от пользователей'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Link>

                            <div style={{ padding: '0 1.5rem 1.5rem' }}>
                                {isAdmin ? (
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.75rem',
                                        width: '100%'
                                    }}>
                                        <button
                                            onClick={(e) => handleEditClick(e, t)}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                fontSize: '0.95rem',
                                                fontWeight: 600,
                                                background: 'linear-gradient(135deg, #FF9800, #F57C00)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseOver={(e) => {
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 4px 12px rgba(255, 152, 0, 0.3)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        >
                                            Редактировать
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteClick(e, t.id)}
                                            disabled={deletingTemplateId === t.id}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                fontSize: '0.95rem',
                                                fontWeight: 600,
                                                background: deletingTemplateId === t.id
                                                    ? '#bdbdbd'
                                                    : 'linear-gradient(135deg, #f44336, #d32f2f)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '10px',
                                                cursor: deletingTemplateId === t.id ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseOver={(e) => {
                                                if (deletingTemplateId !== t.id) {
                                                    e.target.style.transform = 'translateY(-2px)';
                                                    e.target.style.boxShadow = '0 4px 12px rgba(244, 67, 54, 0.3)';
                                                }
                                            }}
                                            onMouseOut={(e) => {
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                            >
                                            {deletingTemplateId === t.id ? (
                                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                                    <span style={{
                                                        width: '14px',
                                                        height: '14px',
                                                        border: '2px solid rgba(255, 255, 255, 0.3)',
                                                        borderTopColor: 'white',
                                                        borderRadius: '50%',
                                                        animation: 'spin 1s linear infinite',
                                                        display: 'inline-block'
                                                    }}></span>
                                                    Удаление...
                                                </span>
                                                ) : (
                                                    'Удалить'
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                    <button
                                        onClick={(e) => handleOrderClick(e, t.id)}
                                        style={{
                                            width: '100%',
                                            padding: '14px',
                                            fontSize: '1.1rem',
                                            fontWeight: 600,
                                            background: token
                                                ? 'linear-gradient(135deg, #4CAF50, #2E7D32)'
                                                : 'linear-gradient(135deg, #FF9800, #F57C00)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseOver={(e) => {
                                            if (token) {
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    >
                                        {token ? 'Подробнее и заказать' : 'Войти для заказа'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                        {/* Карточка для создания нового шаблона (только для админов) */}
                        {isAdmin && (
                            <div
                                onClick={() => setShowCreateModal(true)}
                                style={{
                                    cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #f8f9fa, #e3f2fd)',
                                    border: '2px dashed #bbdefb',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease',
                                    minHeight: '450px'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #e3f2fd, #bbdefb)';
                                    e.currentTarget.style.borderColor = '#2196F3';
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(33, 150, 243, 0.15)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9fa, #e3f2fd)';
                                    e.currentTarget.style.borderColor = '#bbdefb';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ textAlign: 'center', padding: '2rem' }}>
                                    <div style={{
                                        fontSize: '4rem',
                                        color: '#2196F3',
                                        marginBottom: '1rem',
                                        transition: 'transform 0.3s ease'
                                    }}>
                                        ➕
                                    </div>
                                    <h3 style={{
                                        color: '#1a237e',
                                        marginBottom: '0.5rem',
                                        fontSize: '1.3rem',
                                        fontWeight: 600
                                    }}>
                                        Добавить новый шаблон
                                    </h3>
                                    <p style={{
                                        color: '#546e7a',
                                        fontSize: '0.95rem',
                                        maxWidth: '200px',
                                        margin: '0 auto',
                                        lineHeight: 1.5
                                    }}>
                                        Нажмите, чтобы создать новый проект дома
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Модальное окно создания нового шаблона */}
            {showCreateModal && (
                <CreateTemplateModal
                    token={token}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}

            {/* Модальное окно редактирования шаблона */}
            {showEditModal && isAdmin && editingTemplate && (
                <EditTemplateModal
                    token={token}
                    templateId={editingTemplate.id}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingTemplate(null);
                    }}
                    onSuccess={handleUpdateSuccess}
                />
            )}

            <style jsx="true">{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}