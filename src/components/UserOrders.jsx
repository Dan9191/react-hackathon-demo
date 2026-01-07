import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getConfig } from '../config';
import OrderDocuments from './OrderDocuments';
import OrderConstruction from './OrderConstruction';

export default function UserOrders({ token }) {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'documents', 'construction'

 useEffect(() => {
        if (!token) {
            setError('Необходимо авторизоваться');
            setLoading(false);
            return;
        }

        fetchOrders(page, pageSize);
    }, [token, page, pageSize]);

    const fetchOrders = async (currentPage = 0, size = 10) => {
        setLoading(true);
        setError('');

        try {
            const { API_BASE_URL } = getConfig();

            const url = new URL(`${API_BASE_URL}/api/orders`);
            url.searchParams.append('page', currentPage.toString());
            url.searchParams.append('pageSize', size.toString());

            console.log('Fetching orders from:', url.toString());

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            console.log(response);
            if (!response.ok) {
                let errorText = `HTTP ${response.status}`;
                try {
                    const errorData = await response.text();
                    errorText += `: ${errorData}`;
                } catch (e) {
                }
                throw new Error(errorText);
            }

            const data = await response.json();
            console.log('Orders data:', data);

            setOrders(Array.isArray(data.items) ? data.items : []);
            setTotalPages(Math.ceil(data.total / data.pageSize) || 0);
            setTotalElements(data.total || 0);
            setPageSize(data.pageSize || 10);
        } catch (err) {
            console.error('Ошибка загрузки заказов:', err);
            setError(`Не удалось загрузить список заказов: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (statusType) => {
        if (!statusType) return '#9E9E9E';

        const status = statusType.toLowerCase();
        switch (status) {
            case 'new':
                return '#2196F3'; // синий - новый
            case 'documentation':
                return '#9C27B0'; // фиолетовый - документация
            case 'construction':
                return '#FF9800'; // оранжевый - строительство
            case 'completion':
                return '#4CAF50'; // зеленый - подготовка к сдаче
            case 'closed':
                return '#607D8B'; // сине-серый - сдача (завершение)
            case 'cancelled':
                return '#F44336'; // красный - отменен
            default:
                return '#9E9E9E'; // серый
        }
    };

    const getStatusText = (statusType) => {
        if (!statusType) return 'Неизвестно';

        const status = statusType.toLowerCase();
        switch (status) {
            case 'new':
                return 'Новый';
            case 'documentation':
                return 'Подготовка документации';
            case 'construction':
                return 'Строительство';
            case 'completion':
                return 'Подготовка к сдаче';
            case 'closed':
                return 'Сдача (Завершено)';
            case 'cancelled':
                return 'Отменен';
            default:
                return statusType;
        }
    };

    const getStageColor = (stageStatus) => {
        if (!stageStatus) return '#9E9E9E';

        const status = stageStatus.toLowerCase();
        switch (status) {
            case 'not_started':
                return '#757575'; // серый - не начат
            case 'in_progress':
                return '#FF9800'; // оранжевый - в работе
            case 'completed':
                return '#4CAF50'; // зеленый - завершен
            case 'delayed':
                return '#F44336'; // красный - задержан
            default:
                return '#9E9E9E'; // серый
        }
    };

    const getStageStatusText = (stageStatus) => {
        if (!stageStatus) return 'Не начат';

        const status = stageStatus.toLowerCase();
        switch (status) {
            case 'not_started':
                return 'Не начат';
            case 'in_progress':
                return 'В работе';
            case 'completed':
                return 'Завершен';
            case 'delayed':
                return 'Задержан';
            default:
                return stageStatus;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Не указано';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Неверная дата';

            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return 'Ошибка даты';
        }
    };

    const formatPrice = (price) => {
        if (!price) return 'Не указана';

        const num = parseFloat(price);
        if (isNaN(num)) return price;

        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    };

    const calculateProgress = (stage) => {
        if (!stage) return 0;

        if (stage.progress !== undefined) {
            return Math.min(Math.max(stage.progress, 0), 100);
        }

        // Рассчитываем прогресс на основе дат
        if (stage.startDate && stage.plannedEndDate && stage.status === 'in_progress') {
            const start = new Date(stage.startDate).getTime();
            const plannedEnd = new Date(stage.plannedEndDate).getTime();
            const now = new Date().getTime();

            if (start && plannedEnd && now > start) {
                const total = plannedEnd - start;
                const elapsed = now - start;
                return Math.min(Math.round((elapsed / total) * 100), 95);
            }
        }

        return stage.status === 'completed' ? 100 : 0;
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const handlePageSizeChange = (e) => {
        const newSize = parseInt(e.target.value);
        setPageSize(newSize);
        setPage(0);
    };

    const handleRetry = () => {
        setError('');
        fetchOrders(page, pageSize);
    };

    const handleTabChange = (tab) => {
        if (tab === 'applications') {
            navigate('/profile/applications');
        }
    };

    const toggleOrderDetails = (orderId) => {
        if (expandedOrderId === orderId) {
            setExpandedOrderId(null);
            setActiveTab('orders');
        } else {
            setExpandedOrderId(orderId);
            setActiveTab('orders');
        }
    };

    const handleOrderAction = (order, action) => {
        if (action === 'documents' && (order.currentStatus?.statusType?.toLowerCase() === 'documentation'
            || order.currentStatus?.statusType?.toLowerCase() === 'completion')) {
            setExpandedOrderId(order.id);
            setActiveTab('documents');
        } else if (action === 'construction' && (order.currentStatus?.statusType?.toLowerCase() === 'construction'
            || order.currentStatus?.statusType?.toLowerCase() === 'completion')) {
            setExpandedOrderId(order.id);
            setActiveTab('construction');
        } else if (action === 'view') {
            navigate(`/template/${order.projectInfo?.id}`);
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
                <Link to="/" style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    transition: 'all 0.3s ease'
                }}>
                    На главную
                </Link>
            </div>
        );
    }

    return (
        <div style={{ }}>

            {loading ? (
                <div style={{
                    maxWidth: '1200px',
                    margin: '2rem auto',
                    padding: '3rem',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        border: '4px solid #e3f2fd',
                        borderTopColor: '#2196F3',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }}></div>
                    <div style={{ color: '#546e7a', fontSize: '1.1rem' }}>Загрузка заказов...</div>
                </div>
            ) : error ? (
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
                    <p style={{ color: '#546e7a', marginBottom: '1rem' }}>{error}</p>

                    <div style={{
                        background: '#fff3e0',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        textAlign: 'left'
                    }}>
                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Детали:</p>
                        <p style={{ margin: '0 0 0.5rem 0' }}>URL запроса: https://api.mos-hack.ru/api/orders?page=0&pageSize=10</p>
                        <p style={{ margin: 0 }}>Проверьте консоль браузера для получения дополнительной информации</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button onClick={handleRetry} style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}>
                            Попробовать снова
                        </button>
                        <Link to="/" style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            border: '1px solid #e0e0e0',
                            color: '#666',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            transition: 'all 0.3s ease'
                        }}>
                            На главную
                        </Link>
                    </div>
                </div>
            ) : orders.length === 0 ? (
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '4rem 2rem',
                    textAlign: 'center',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
                    <h2 style={{ color: '#1a237e', marginBottom: '1rem' }}>Заказов пока нет</h2>
                    <p style={{ color: '#546e7a', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto' }}>
                        У вас еще нет оформленных заказов. После принятия вашей заявки менеджером, здесь появятся детали вашего заказа с информацией о прогрессе строительства.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button
                            onClick={() => handleTabChange('applications')}
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            Посмотреть заявки
                        </button>
                        <Link to="/" style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            border: '1px solid #e0e0e0',
                            color: '#666',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            transition: 'all 0.3s ease'
                        }}>
                            К проектам
                        </Link>
                    </div>
                </div>
            ) : (
                <>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '2rem',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1.5rem',
                            paddingBottom: '1rem',
                            borderBottom: '2px solid #f0f0f0'
                        }}>
                            <div>
                                <h2 style={{ color: '#1a237e', margin: 0 }}>Мои заказы</h2>
                                <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                    Всего заказов: {totalElements}
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ color: '#666', fontSize: '0.9rem' }}>На странице:</span>
                                    <select
                                        value={pageSize}
                                        onChange={handlePageSizeChange}
                                        disabled={loading}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid #e0e0e0',
                                            background: 'white',
                                            color: '#333',
                                            fontSize: '0.9rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="5">5</option>
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => fetchOrders(page, pageSize)}
                                    disabled={loading}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        border: '1px solid #e0e0e0',
                                        background: 'transparent',
                                        color: loading ? '#999' : '#2196F3',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => !loading && (e.target.style.background = '#e3f2fd')}
                                    onMouseOut={(e) => !loading && (e.target.style.background = 'transparent')}
                                >
                                    {loading ? (
                                        <>
                                            <span style={{
                                                width: '16px',
                                                height: '16px',
                                                border: '2px solid #e3f2fd',
                                                borderTopColor: '#2196F3',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite'
                                            }}></span>
                                            Загрузка...
                                        </>
                                    ) : (
                                        <>
                                            <span>🔄</span> Обновить
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {orders.map(order => {
                                const isExpanded = expandedOrderId === order.id;
                                const orderStatus = order.currentStatus?.statusType?.toLowerCase();
                                const progress = calculateProgress(order.currentStage);

                                return (
                                    <div key={order.id} style={{
                                        border: `1px solid ${isExpanded ? '#2196F3' : '#e0e0e0'}`,
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
                                            borderBottom: '1px solid #e0e0e0',
                                            cursor: 'pointer'
                                        }} onClick={() => toggleOrderDetails(order.id)}>
                                            <div>
                                                <h3 style={{
                                                    color: '#1a237e',
                                                    margin: '0 0 0.5rem 0',
                                                    fontSize: '1.3rem'
                                                }}>
                                                    Заказ #{order.id} - {order.projectInfo?.title || 'Проект дома'}
                                                </h3>
                                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#666' }}>
                                                    <span>📅 Создан: {formatDate(order.createdAt)}</span>
                                                    <span>📍 Адрес: {order.address || 'Не указан'}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '20px',
                                                    background: getStatusColor(order.currentStatus?.statusType),
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {getStatusText(order.currentStatus?.statusType)}
                                                </div>
                                                <span style={{
                                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.3s ease',
                                                    fontSize: '1.5rem'
                                                }}>
                                                    ▼
                                                </span>
                                            </div>
                                        </div>

                                        {/* Основное содержимое заказа */}
                                        {isExpanded && (
                                            <div style={{ padding: '1.5rem' }}>
                                                {/* Вкладки для разных разделов */}
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '0.5rem',
                                                    marginBottom: '1.5rem',
                                                    borderBottom: '1px solid #e0e0e0',
                                                    paddingBottom: '0.5rem'
                                                }}>
                                                    <button
                                                        onClick={() => setActiveTab('orders')}
                                                        style={{
                                                            padding: '8px 16px',
                                                            background: activeTab === 'orders' ? '#e3f2fd' : 'transparent',
                                                            border: 'none',
                                                            color: activeTab === 'orders' ? '#2196F3' : '#666',
                                                            cursor: 'pointer',
                                                            borderRadius: '6px',
                                                            fontWeight: activeTab === 'orders' ? '600' : '400'
                                                        }}
                                                    >
                                                        📋 Детали заказа
                                                    </button>
                                                    {orderStatus === 'documentation' || orderStatus === 'completion' && (
                                                        <button
                                                            onClick={() => setActiveTab('documents')}
                                                            style={{
                                                                padding: '8px 16px',
                                                                background: activeTab === 'documents' ? '#f3e5f5' : 'transparent',
                                                                border: 'none',
                                                                color: activeTab === 'documents' ? '#9C27B0' : '#666',
                                                                cursor: 'pointer',
                                                                borderRadius: '6px',
                                                                fontWeight: activeTab === 'documents' ? '600' : '400'
                                                            }}
                                                        >
                                                            📄 Документы
                                                        </button>
                                                    )}
                                                    {(orderStatus === 'construction' || orderStatus === 'completion') && (
                                                        <button
                                                            onClick={() => setActiveTab('construction')}
                                                            style={{
                                                                padding: '8px 16px',
                                                                background: activeTab === 'construction' ? '#fff3e0' : 'transparent',
                                                                border: 'none',
                                                                color: activeTab === 'construction' ? '#FF9800' : '#666',
                                                                cursor: 'pointer',
                                                                borderRadius: '6px',
                                                                fontWeight: activeTab === 'construction' ? '600' : '400'
                                                            }}
                                                        >
                                                            🏗️ Ход строительства
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Содержимое активной вкладки */}
                                                {activeTab === 'orders' ? (
                                                    <>
                                                        {/* Общая информация о заказе */}
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                                            gap: '1.5rem',
                                                            marginBottom: '1.5rem'
                                                        }}>
                                                            {/* Информация о проекте */}
                                                            <div>
                                                                <h4 style={{
                                                                    color: '#37474f',
                                                                    margin: '0 0 0.5rem 0',
                                                                    fontSize: '1rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px'
                                                                }}>
                                                                    <span>🏠</span> Проект
                                                                </h4>
                                                                <p style={{
                                                                    color: '#546e7a',
                                                                    margin: '0 0 0.25rem 0',
                                                                    fontSize: '1.1rem',
                                                                    fontWeight: 500
                                                                }}>
                                                                    {order.projectInfo?.title || 'Не указан'}
                                                                </p>
                                                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#666' }}>
                                                                    <span>Площадь: {order.projectInfo?.totalArea || '—'} м²</span>
                                                                    <span>Цена: {formatPrice(order.projectInfo?.basePrice)}</span>
                                                                </div>
                                                            </div>

                                                            {/* Статус заказа */}
                                                            <div>
                                                                <h4 style={{
                                                                    color: '#37474f',
                                                                    margin: '0 0 0.5rem 0',
                                                                    fontSize: '1rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px'
                                                                }}>
                                                                    <span>📊</span> Статус заказа
                                                                </h4>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <div style={{
                                                                        width: '10px',
                                                                        height: '10px',
                                                                        borderRadius: '50%',
                                                                        background: getStatusColor(order.currentStatus?.statusType)
                                                                    }}></div>
                                                                    <span style={{
                                                                        color: '#546e7a',
                                                                        fontSize: '1rem'
                                                                    }}>
                                                                        {getStatusText(order.currentStatus?.statusType)}
                                                                    </span>
                                                                </div>
                                                                {order.currentStatus?.comment && (
                                                                    <p style={{
                                                                        fontSize: '0.9rem',
                                                                        color: '#666',
                                                                        margin: '0.5rem 0 0 0',
                                                                        fontStyle: 'italic'
                                                                    }}>
                                                                        Комментарий: {order.currentStatus.comment}
                                                                    </p>
                                                                )}
                                                                {order.currentStatus?.changedBy && (
                                                                    <p style={{
                                                                        fontSize: '0.85rem',
                                                                        color: '#999',
                                                                        margin: '0.25rem 0 0 0'
                                                                    }}>
                                                                        Изменен: {order.currentStatus.changedBy.fullName} ({order.currentStatus.changedBy.role})
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Информация о клиенте */}
                                                            {order.clientInfo && (
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
                                                                        {order.clientInfo.fullName || 'Не указано'}
                                                                    </p>
                                                                    {order.clientInfo.email && (
                                                                        <p style={{
                                                                            fontSize: '0.9rem',
                                                                            color: '#666',
                                                                            margin: '0.25rem 0 0 0'
                                                                        }}>
                                                                            {order.clientInfo.email}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Текущий этап строительства */}
                                                        {order.currentStage && orderStatus !== 'new' && orderStatus !== 'documentation' && (
                                                            <div style={{
                                                                border: '1px solid #e0e0e0',
                                                                borderRadius: '8px',
                                                                padding: '1.5rem',
                                                                marginBottom: '1.5rem',
                                                                background: '#fafafa'
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
                                                                        fontSize: '1.1rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '8px'
                                                                    }}>
                                                                        <span>🏗️</span> Текущий этап: {order.currentStage.stageName}
                                                                    </h4>
                                                                    <div style={{
                                                                        padding: '6px 12px',
                                                                        borderRadius: '20px',
                                                                        background: getStageColor(order.currentStage.status),
                                                                        color: 'white',
                                                                        fontWeight: 600,
                                                                        fontSize: '0.8rem'
                                                                    }}>
                                                                        {getStageStatusText(order.currentStage.status)}
                                                                    </div>
                                                                </div>

                                                                <p style={{
                                                                    color: '#666',
                                                                    margin: '0 0 1rem 0',
                                                                    fontSize: '0.9rem'
                                                                }}>
                                                                    {order.currentStage.description || 'Описание этапа отсутствует'}
                                                                </p>

                                                                {/* Прогресс этапа */}
                                                                <div style={{ marginBottom: '1rem' }}>
                                                                    <div style={{
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        marginBottom: '0.5rem',
                                                                        fontSize: '0.9rem',
                                                                        color: '#666'
                                                                    }}>
                                                                        <span>Прогресс выполнения:</span>
                                                                        <span>{progress}%</span>
                                                                    </div>
                                                                    <div style={{
                                                                        width: '100%',
                                                                        height: '8px',
                                                                        background: '#e0e0e0',
                                                                        borderRadius: '4px',
                                                                        overflow: 'hidden'
                                                                    }}>
                                                                        <div style={{
                                                                            width: `${progress}%`,
                                                                            height: '100%',
                                                                            background: order.currentStage.status === 'completed' ? '#4CAF50' :
                                                                                order.currentStage.status === 'delayed' ? '#F44336' : '#2196F3',
                                                                            borderRadius: '4px',
                                                                            transition: 'width 0.5s ease'
                                                                        }}></div>
                                                                    </div>
                                                                </div>

                                                                {/* Даты этапа */}
                                                                <div style={{
                                                                    display: 'grid',
                                                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                                                    gap: '1rem',
                                                                    fontSize: '0.85rem',
                                                                    color: '#666'
                                                                }}>
                                                                    <div>
                                                                        <span style={{ fontWeight: 600 }}>Начало:</span> {formatDate(order.currentStage.startDate) || 'Не указано'}
                                                                    </div>
                                                                    <div>
                                                                        <span style={{ fontWeight: 600 }}>Планируемое окончание:</span> {formatDate(order.currentStage.plannedEndDate) || 'Не указано'}
                                                                    </div>
                                                                    {order.currentStage.actualEndDate && (
                                                                        <div>
                                                                            <span style={{ fontWeight: 600 }}>Фактическое окончание:</span> {formatDate(order.currentStage.actualEndDate)}
                                                                        </div>
                                                                    )}
                                                                    {order.currentStage.createdBy && (
                                                                        <div>
                                                                            <span style={{ fontWeight: 600 }}>Ответственный:</span> {order.currentStage.createdBy.fullName} ({order.currentStage.createdBy.role})
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Кнопки действий */}
                                                        <div style={{
                                                            display: 'flex',
                                                            gap: '1rem',
                                                            paddingTop: '1.5rem',
                                                            borderTop: '1px solid #f0f0f0'
                                                        }}>
                                                            <button
                                                                onClick={() => handleOrderAction(order, 'view')}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    padding: '10px 16px',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #e0e0e0',
                                                                    background: 'transparent',
                                                                    color: '#2196F3',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.3s ease'
                                                                }}
                                                                onMouseOver={(e) => {
                                                                    e.target.style.background = '#e3f2fd';
                                                                    e.target.style.borderColor = '#2196F3';
                                                                }}
                                                                onMouseOut={(e) => {
                                                                    e.target.style.background = 'transparent';
                                                                    e.target.style.borderColor = '#e0e0e0';
                                                                }}
                                                            >
                                                                <span>👁️</span> Посмотреть проект
                                                            </button>
                                                            
                                                            {(orderStatus === 'documentation' || orderStatus === 'completion') && (
                                                                <button
                                                                    onClick={() => handleOrderAction(order, 'documents')}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '8px',
                                                                        padding: '10px 16px',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #9C27B0',
                                                                        background: 'transparent',
                                                                        color: '#9C27B0',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.3s ease'
                                                                    }}
                                                                    onMouseOver={(e) => {
                                                                        e.target.style.background = '#f3e5f5';
                                                                        e.target.style.borderColor = '#9C27B0';
                                                                    }}
                                                                    onMouseOut={(e) => {
                                                                        e.target.style.background = 'transparent';
                                                                        e.target.style.borderColor = '#9C27B0';
                                                                    }}
                                                                >
                                                                    <span>📄</span> Работа с документами
                                                                </button>
                                                            )}
                                                            
                                                            {(orderStatus === 'construction' || orderStatus === 'completion') && (
                                                                <button
                                                                    onClick={() => handleOrderAction(order, 'construction')}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '8px',
                                                                        padding: '10px 16px',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #FF9800',
                                                                        background: 'transparent',
                                                                        color: '#FF9800',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.3s ease'
                                                                    }}
                                                                    onMouseOver={(e) => {
                                                                        e.target.style.background = '#fff3e0';
                                                                        e.target.style.borderColor = '#FF9800';
                                                                    }}
                                                                    onMouseOut={(e) => {
                                                                        e.target.style.background = 'transparent';
                                                                        e.target.style.borderColor = '#FF9800';
                                                                    }}
                                                                >
                                                                    <span>🏗️</span> Ход строительства
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                ) : activeTab === 'documents' && (orderStatus === 'documentation' || orderStatus === 'completion') ? (
                                                    <OrderDocuments token={token} orderId={order.id} />
                                                ) : activeTab === 'construction' && (orderStatus === 'construction' || orderStatus === 'completion') ? (
                                                    <OrderConstruction token={token} orderId={order.id} />
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Пагинация */}
                    {totalPages > 1 && (
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '1rem'
                        }}>
                            <button
                                onClick={() => handlePageChange(1)}
                                disabled={page === 1 || loading}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid #e0e0e0',
                                    background: page === 1 ? '#f5f5f5' : 'white',
                                    color: page === 1 ? '#999' : '#333',
                                    cursor: page === 1 || loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    fontSize: '0.9rem'
                                }}
                            >
                                ⏮️ Первая
                            </button>

                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1 || loading}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid #e0e0e0',
                                    background: page === 1 ? '#f5f5f5' : 'white',
                                    color: page === 1 ? '#999' : '#333',
                                    cursor: page === 1 || loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    fontSize: '0.9rem'
                                }}
                            >
                                ◀️ Назад
                            </button>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.9rem',
                                color: '#666'
                            }}>
                                <span>Страница</span>
                                <span style={{
                                    padding: '4px 12px',
                                    background: '#e3f2fd',
                                    borderRadius: '4px',
                                    fontWeight: 600,
                                    color: '#2196F3'
                                }}>
                                    {page}
                                </span>
                                <span>из</span>
                                <span style={{ fontWeight: 600 }}>{totalPages}</span>
                            </div>

                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page >= totalPages || loading}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid #e0e0e0',
                                    background: page >= totalPages ? '#f5f5f5' : 'white',
                                    color: page >= totalPages ? '#999' : '#333',
                                    cursor: page >= totalPages || loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Вперед ▶️
                            </button>

                            <button
                                onClick={() => handlePageChange(totalPages)}
                                disabled={page >= totalPages || loading}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid #e0e0e0',
                                    background: page >= totalPages ? '#f5f5f5' : 'white',
                                    color: page >= totalPages ? '#999' : '#333',
                                    cursor: page >= totalPages || loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Последняя ⏭️
                            </button>
                        </div>
                    )}
                </>
            )}

            <style jsx="true">{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}