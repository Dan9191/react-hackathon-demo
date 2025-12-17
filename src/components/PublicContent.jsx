import React, { useEffect, useState } from 'react';
import { getConfig } from '../config';
import { Link } from 'react-router-dom';

export default function PublicContent({ token }) {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const { API_BASE_URL, TEMPLATES_LIST_URL } = getConfig();
        fetch(`${API_BASE_URL}${TEMPLATES_LIST_URL}`)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => {
                setTemplates(data.content || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load templates:', err);
                setError('Не удалось загрузить шаблоны');
                setLoading(false);
            });
    }, []);

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

    if (loading) return (
        <div className="loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">Загрузка шаблонов...</div>
        </div>
    );

    if (error) return (
        <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <h3>Ошибка загрузки</h3>
            <p>{error}</p>
            <button 
                onClick={() => window.location.reload()}
                className="btn btn-primary"
            >
                Попробовать снова
            </button>
        </div>
    );

    if (templates.length === 0) return (
        <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <h3>Шаблоны не найдены</h3>
            <p>Пока что нет доступных шаблонов домов</p>
        </div>
    );

    return (
        <div className="container">
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
                    🏡 Каталог домов
                </h1>
                <p style={{ 
                    fontSize: '1.1rem', 
                    color: '#546e7a',
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    Выберите проект вашего будущего дома из нашей коллекции готовых шаблонов
                </p>
            </div>

            <div className="project-grid">
                {templates.map(t => (
                    <div key={t.id} className="project-card">
                        <Link to={`/template/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="project-image">
                                {t.previewUrl ? (
                                    <img src={t.previewUrl} alt={t.title} loading="lazy" />
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
                            <div className="project-info">
                                <h3>{t.title}</h3>
                                <p><strong>🎨 Стиль:</strong> {t.style || 'Не указан'}</p>
                                <p><strong>📏 Площадь:</strong> {t.areaM2} м²</p>
                                <p><strong>🚪 Комнаты:</strong> {t.rooms}</p>
                                <p><strong>⚡ Статус:</strong> {t.isActive ? '✅ Активен' : '⏸️ Неактивен'}</p>
                                <div className="price">{Number(t.basePrice).toLocaleString('ru-RU')} ₽</div>
                            </div>
                        </Link>
                        
                        <div style={{ padding: '0 1.5rem 1.5rem' }}>
                            <button
                                onClick={(e) => handleOrderClick(e, t.id)}
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '1rem',
                                    background: token ? 'linear-gradient(135deg, #4CAF50, #2E7D32)' : 'linear-gradient(135deg, #FF9800, #F57C00)'
                                }}
                            >
                                {token ? '📝 Заказать проект' : '🔑 Войти для заказа'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}