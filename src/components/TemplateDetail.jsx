import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getConfig } from '../config';
import OrderModal from './OrderModal';

export default function TemplateDetail({ token, setToken }) {
    const { id } = useParams();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showOrderModal, setShowOrderModal] = useState(false);

    useEffect(() => {
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
        setShowOrderModal(true);
    };

    if (loading) return (
        <div className="loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">Загрузка информации...</div>
        </div>
    );

    if (error) return (
        <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <h3>Ошибка загрузки</h3>
            <p>{error}</p>
            <Link to="/" className="btn btn-primary">
                Вернуться к каталогу
            </Link>
        </div>
    );

    if (!template) return (
        <div className="empty-state">
            <div className="empty-icon">❌</div>
            <h3>Шаблон не найден</h3>
            <p>Запрашиваемый шаблон не существует или был удален</p>
            <Link to="/" className="btn btn-primary">
                Вернуться к каталогу
            </Link>
        </div>
    );

    const previews = template.files?.filter(f => f.fileRole === 'preview' || f.fileRole === 'gallery') || [];
    const documents = template.files?.filter(f => f.fileRole === 'document') || [];

    return (
        <div className="template-container">
            <Link to="/" className="back-link">
                ← Назад к каталогу
            </Link>

            <div className="template-header">
                <h1>{template.title}</h1>
                {template.description && (
                    <p className="template-description">{template.description}</p>
                )}
            </div>

            <div className="template-stats">
                <div className="stat-item">
                    <div className="stat-icon">🎨</div>
                    <div className="stat-content">
                        <h3>Стиль</h3>
                        <p>{template.style || 'Не указан'}</p>
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-icon">📏</div>
                    <div className="stat-content">
                        <h3>Площадь</h3>
                        <p>{template.areaM2} м²</p>
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-icon">🚪</div>
                    <div className="stat-content">
                        <h3>Комнаты</h3>
                        <p>{template.rooms}</p>
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <h3>Базовая цена</h3>
                        <p>{Number(template.basePrice).toLocaleString('ru-RU')} ₽</p>
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-icon">⚡</div>
                    <div className="stat-content">
                        <h3>Статус</h3>
                        <p>{template.isActive ? '✅ Активен' : '⏸️ Неактивен'}</p>
                    </div>
                </div>
            </div>

            {/* Кнопка заказа */}
            <div style={{
                textAlign: 'center',
                margin: '2rem 0',
                padding: '2rem',
                background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                borderRadius: '16px'
            }}>
                <h2 style={{ color: '#1a237e', marginBottom: '1rem' }}>
                    🏡 Заинтересовал этот проект?
                </h2>
                <p style={{ color: '#546e7a', marginBottom: '1.5rem' }}>
                    Оформите заявку на строительство дома по этому проекту
                </p>
                <button
                    onClick={handleOrderClick}
                    className="btn btn-primary"
                    style={{
                        padding: '16px 40px',
                        fontSize: '1.2rem',
                        fontWeight: 700
                    }}
                >
                    {token ? '📝 Оформить заказ' : '🔑 Войти для оформления заказа'}
                </button>
                {!token && (
                    <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
                        После авторизации вы сможете оформить заказ
                    </p>
                )}
            </div>

            {previews.length > 0 && (
                <div className="gallery">
                    <h2><span>🖼️</span> Фотографии проекта</h2>
                    <div className="gallery-grid">
                        {previews.map(file => (
                            <a 
                                key={file.id} 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="gallery-item"
                            >
                                <img 
                                    src={file.url} 
                                    alt={file.filename}
                                    loading="lazy"
                                />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {documents.length > 0 && (
                <div className="documents">
                    <h2><span>📄</span> Документы</h2>
                    <ul className="document-list">
                        {documents.map(file => (
                            <li key={file.id} className="document-item">
                                <div className="document-icon">
                                    {file.filename.endsWith('.pdf') ? '📄' : '📋'}
                                </div>
                                <a 
                                    href={file.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="document-link"
                                >
                                    {file.filename}
                                </a>
                                <span className="document-size">
                                    {file.fileSize ? `(${(file.fileSize / 1024).toFixed(1)} KB)` : ''}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {showOrderModal && token && (
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
        </div>
    );
}