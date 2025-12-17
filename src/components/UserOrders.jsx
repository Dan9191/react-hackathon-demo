import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getConfig } from '../config';

export default function UserOrders({ token }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Необходимо авторизоваться');
            setLoading(false);
            return;
        }

        fetchOrders();
    }, [token]);

    const fetchOrders = async () => {
        setLoading(true);
        setError('');
        
        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}`);
            }

            const data = await response.json();
            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Ошибка загрузки заказов:', err);
            setError('Не удалось загрузить список заказов');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (statusType) => {
        switch (statusType) {
            case 'new':
                return '#2196F3'; // синий
            case 'in_progress':
                return '#FF9800'; // оранжевый
            case 'completed':
                return '#4CAF50'; // зеленый
            case 'cancelled':
                return '#F44336'; // красный
            default:
                return '#9E9E9E'; // серый
        }
    };

    const getStatusText = (statusType) => {
        switch (statusType) {
            case 'new':
                return 'Новый';
            case 'in_progress':
                return 'В работе';
            case 'completed':
                return 'Завершен';
            case 'cancelled':
                return 'Отменен';
            default:
                return statusType;
        }
    };

    const getStageStatusText = (status) => {
        switch (status) {
            case 'not_started':
                return 'Не начат';
            case 'in_progress':
                return 'В процессе';
            case 'completed':
                return 'Завершен';
            case 'delayed':
                return 'Задержан';
            default:
                return status;
        }
    };

    if (!token) {
        return (
            <div style={{
                maxWidth: '800px',
                margin: '2rem auto',
                padding: '3rem',
                textAlign: 'center',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
                <h2 style={{ color: '#1a237e', marginBottom: '1rem' }}>Требуется авторизация</h2>
                <p style={{ color: '#546e7a', marginBottom: '2rem' }}>
                    Для просмотра заказов необходимо войти в систему
                </p>
                <Link to="/" className="btn btn-primary">
                    На главную
                </Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{
                maxWidth: '1200px',
                margin: '2rem auto',
                padding: '3rem',
                textAlign: 'center'
            }}>
                <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
                <div className="loading-text">Загрузка заказов...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                maxWidth: '800px',
                margin: '2rem auto',
                padding: '3rem',
                textAlign: 'center',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
                <h2 style={{ color: '#1a237e', marginBottom: '1rem' }}>Ошибка загрузки</h2>
                <p style={{ color: '#546e7a', marginBottom: '2rem' }}>{error}</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button onClick={fetchOrders} className="btn btn-primary">
                        Попробовать снова
                    </button>
                    <Link to="/" className="btn btn-outline">
                        На главную
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '2rem auto',
            padding: '0 1rem'
        }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link to="/" className="back-link">
                    ← На главную
                </Link>
                <h1 style={{ 
                    fontSize: '2rem', 
                    color: '#1a237e',
                    margin: '1rem 0',
                    fontWeight: 700
                }}>
                    👤 Личный кабинет
                </h1>
                <p style={{ color: '#546e7a' }}>
                    Здесь отображаются все ваши заказы на строительство домов
                </p>
            </div>

            {orders.length === 0 ? (
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '4rem 2rem',
                    textAlign: 'center',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
                    <h2 style={{ color: '#1a237e', marginBottom: '1rem' }}>Заказов пока нет</h2>
                    <p style={{ color: '#546e7a', marginBottom: '2rem' }}>
                        У вас еще нет оформленных заказов. Посмотрите каталог проектов и выберите подходящий!
                    </p>
                    <Link to="/" className="btn btn-primary">
                        Перейти в каталог
                    </Link>
                </div>
            ) : (
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '2rem',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.5rem',
                        paddingBottom: '1rem',
                        borderBottom: '2px solid #f0f0f0'
                    }}>
                        <h2 style={{ color: '#1a237e', margin: 0 }}>Мои заказы ({orders.length})</h2>
                        <button 
                            onClick={fetchOrders}
                            className="btn btn-outline"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <span>🔄</span> Обновить
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {orders.map(order => (
                            <div key={order.id} style={{
                                border: '1px solid #e0e0e0',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                transition: 'all 0.3s ease'
                            }}>
                                {/* Заголовок заказа */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1.5rem',
                                    background: '#f8f9fa',
                                    borderBottom: '1px solid #e0e0e0'
                                }}>
                                    <div>
                                        <h3 style={{ 
                                            color: '#1a237e', 
                                            margin: '0 0 0.5rem 0',
                                            fontSize: '1.3rem'
                                        }}>
                                            Заказ #{order.id} • {order.projectInfo.title}
                                        </h3>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#666' }}>
                                            <span>📅 Создан: {new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
                                            <span>💰 Стоимость: {order.projectInfo.basePrice} ₽</span>
                                            <span>📏 Площадь: {order.projectInfo.totalArea} м²</span>
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        background: getStatusColor(order.currentStatus.statusType),
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.9rem'
                                    }}>
                                        {getStatusText(order.currentStatus.statusType)}
                                    </div>
                                </div>

                                {/* Детали заказа */}
                                <div style={{ padding: '1.5rem' }}>
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                        gap: '1.5rem',
                                        marginBottom: '1.5rem'
                                    }}>
                                        {/* Адрес */}
                                        <div>
                                            <h4 style={{ 
                                                color: '#37474f', 
                                                margin: '0 0 0.5rem 0',
                                                fontSize: '1rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <span>📍</span> Адрес строительства
                                            </h4>
                                            <p style={{ color: '#546e7a', margin: 0 }}>{order.address}</p>
                                        </div>

                                        {/* Текущий статус */}
                                        <div>
                                            <h4 style={{ 
                                                color: '#37474f', 
                                                margin: '0 0 0.5rem 0',
                                                fontSize: '1rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <span>📊</span> Текущий статус
                                            </h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '10px',
                                                    height: '10px',
                                                    borderRadius: '50%',
                                                    background: getStatusColor(order.currentStatus.statusType)
                                                }}></div>
                                                <span style={{ color: '#546e7a' }}>
                                                    {order.currentStatus.comment}
                                                </span>
                                            </div>
                                            <p style={{ 
                                                fontSize: '0.85rem', 
                                                color: '#999',
                                                margin: '0.5rem 0 0 0'
                                            }}>
                                                Обновлен: {new Date(order.currentStatus.createdAt).toLocaleDateString('ru-RU')}
                                            </p>
                                        </div>

                                        {/* Клиент */}
                                        <div>
                                            <h4 style={{ 
                                                color: '#37474f', 
                                                margin: '0 0 0.5rem 0',
                                                fontSize: '1rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <span>👤</span> Клиент
                                            </h4>
                                            <p style={{ color: '#546e7a', margin: 0 }}>
                                                {order.clientInfo.fullName}
                                            </p>
                                            <p style={{ 
                                                fontSize: '0.9rem', 
                                                color: '#666',
                                                margin: '0.25rem 0 0 0'
                                            }}>
                                                {order.clientInfo.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Текущий этап */}
                                    {order.currentStage && (
                                        <div style={{
                                            background: '#f5f5f5',
                                            borderRadius: '8px',
                                            padding: '1rem',
                                            marginTop: '1rem'
                                        }}>
                                            <div style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '1rem'
                                            }}>
                                                <h4 style={{ 
                                                    color: '#37474f', 
                                                    margin: 0,
                                                    fontSize: '1rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <span>🏗️</span> Текущий этап: {order.currentStage.stageName}
                                                </h4>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    background: '#e3f2fd',
                                                    color: '#1976D2',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600
                                                }}>
                                                    {getStageStatusText(order.currentStage.status)}
                                                </span>
                                            </div>
                                            
                                            <p style={{ color: '#546e7a', margin: '0 0 0.5rem 0' }}>
                                                {order.currentStage.description}
                                            </p>
                                            
                                            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: '#666' }}>
                                                <span>📅 Начало: {new Date(order.currentStage.startDate).toLocaleDateString('ru-RU')}</span>
                                                <span>📅 План: {new Date(order.currentStage.plannedEndDate).toLocaleDateString('ru-RU')}</span>
                                                {order.currentStage.actualEndDate && (
                                                    <span>✅ Факт: {new Date(order.currentStage.actualEndDate).toLocaleDateString('ru-RU')}</span>
                                                )}
                                            </div>

                                            {/* Прогресс-бар */}
                                            {order.currentStage.progress !== undefined && (
                                                <div style={{ marginTop: '1rem' }}>
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between',
                                                        marginBottom: '0.5rem'
                                                    }}>
                                                        <span style={{ fontSize: '0.9rem', color: '#666' }}>Прогресс выполнения</span>
                                                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1976D2' }}>
                                                            {order.currentStage.progress}%
                                                        </span>
                                                    </div>
                                                    <div style={{
                                                        width: '100%',
                                                        height: '8px',
                                                        background: '#e0e0e0',
                                                        borderRadius: '4px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            width: `${order.currentStage.progress}%`,
                                                            height: '100%',
                                                            background: 'linear-gradient(90deg, #2196F3, #21CBF3)',
                                                            borderRadius: '4px',
                                                            transition: 'width 0.3s ease'
                                                        }}></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Комментарии */}
                                    <div style={{ marginTop: '1.5rem' }}>
                                        {order.currentStatus.comment && (
                                            <div style={{
                                                padding: '1rem',
                                                background: '#fff8e1',
                                                borderRadius: '8px',
                                                borderLeft: '4px solid #ffb300'
                                            }}>
                                                <p style={{ 
                                                    margin: 0, 
                                                    color: '#5d4037',
                                                    fontSize: '0.9rem',
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '8px'
                                                }}>
                                                    <span>💬</span> {order.currentStatus.comment}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Кнопки действий */}
                                    <div style={{ 
                                        display: 'flex', 
                                        gap: '1rem',
                                        marginTop: '1.5rem',
                                        paddingTop: '1rem',
                                        borderTop: '1px solid #f0f0f0'
                                    }}>
                                        <Link 
                                            to={`/template/${order.projectInfo.id}`}
                                            className="btn btn-outline"
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            <span>👁️</span> Посмотреть проект
                                        </Link>
                                        <button 
                                            className="btn btn-outline"
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                            onClick={() => alert('Функция связи с менеджером будет доступна в ближайшее время')}
                                        >
                                            <span>📞</span> Связаться с менеджером
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}