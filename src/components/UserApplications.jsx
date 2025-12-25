import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getConfig } from '../config';
const UserOrders = lazy(() => import('./UserOrders'));

export default function UserApplications({ token }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [managerNames, setManagerNames] = useState({}); // Кэш имен менеджеров
    const [activeTab, setActiveTab] = useState('applications'); // 'applications' или 'orders'

    // Определяем активную вкладку из URL
    useEffect(() => {
        if (location.pathname.includes('/profile/orders')) {
            setActiveTab('orders');
        } else {
            setActiveTab('applications');
        }
    }, [location.pathname]);

    useEffect(() => {
        if (!token) {
            setError('Необходимо авторизоваться');
            setLoading(false);
            return;
        }

        if (activeTab === 'applications') {
            fetchApplications(page, pageSize);
        }
    }, [token, page, pageSize, activeTab]);



    const fetchApplications = async (currentPage = 0, size = 20) => {
        setLoading(true);
        setError('');

        try {
            const { API_BASE_URL } = getConfig();

            const url = new URL(`${API_BASE_URL}/api/applications/user`);
            url.searchParams.append('page', currentPage.toString());
            url.searchParams.append('size', size.toString());

            console.log('Fetching applications from:', url.toString());

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

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
            console.log('Applications data:', data);

            const applicationsList = Array.isArray(data.content) ? data.content : [];
            setApplications(applicationsList);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
            setPageSize(data.size || 10);


        } catch (err) {
            console.error('Ошибка загрузки заявок:', err);
            setError(`Не удалось загрузить список заявок: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (statusName) => {
        if (!statusName) return '#9E9E9E';

        const status = statusName.toLowerCase();
        switch (status) {
            case 'created':
                return '#2196F3'; // синий - создана
            case 'consideration':
                return '#FF9800'; // оранжевый - на рассмотрении
            case 'accepted':
                return '#4CAF50'; // зеленый - принята
            case 'rejected':
                return '#F44336'; // красный - отклонена
            default:
                return '#9E9E9E'; // серый
        }
    };

    const getStatusText = (statusName) => {
        if (!statusName) return 'Неизвестно';

        const status = statusName.toLowerCase();
        switch (status) {
            case 'created':
                return 'Создана';
            case 'consideration':
                return 'На рассмотрении';
            case 'accepted':
                return 'Принята';
            case 'rejected':
                return 'Отклонена';
            default:
                return statusName;
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

    const getContactIcon = (contact) => {
        if (!contact) return '📝';

        if (contact.includes('@') || contact.includes('telegram') || contact.startsWith('@')) {
            return '📱'; // Telegram
        } else if (contact.includes('vk.com') || contact.includes('id')) {
            return '👥'; // ВКонтакте
        } else if (contact.includes('@') && contact.includes('.')) {
            return '📧'; // Email
        } else if (contact.includes('whatsapp') || contact.includes('wa.me')) {
            return '💬'; // WhatsApp
        } else if (/^\+?[\d\s\-\(\)]+$/.test(contact)) {
            return '📞'; // Телефон
        }
        return '📝'; // По умолчанию
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
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
        fetchApplications(page, pageSize);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'orders') {
            navigate('/profile/orders');
        } else {
            navigate('/profile/applications');
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
                    Для просмотра заявок необходимо войти в систему
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
        <div style={{
            maxWidth: '1200px',
            margin: '2rem auto',
            padding: '0 1rem'
        }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link to="/" style={{
                    color: '#2196F3',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '1rem'
                }}>
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
                    Управляйте своими заявками и отслеживайте статус заказов
                </p>
            </div>

            {/* Вкладки */}
            <div style={{
                display: 'flex',
                marginBottom: '2rem',
                background: 'white',
                borderRadius: '12px',
                padding: '0.5rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}>
                <button
                    onClick={() => handleTabChange('applications')}
                    style={{
                        flex: 1,
                        padding: '1rem 1.5rem',
                        border: 'none',
                        background: activeTab === 'applications' ? '#2196F3' : 'transparent',
                        color: activeTab === 'applications' ? 'white' : '#666',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <span>📝</span> Мои заявки
                </button>
                <button
                    onClick={() => handleTabChange('orders')}
                    style={{
                        flex: 1,
                        padding: '1rem 1.5rem',
                        border: 'none',
                        background: activeTab === 'orders' ? '#2196F3' : 'transparent',
                        color: activeTab === 'orders' ? 'white' : '#666',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <span>📦</span> Мои заказы
                </button>
            </div>

            {activeTab === 'orders' ? (
                // Здесь будет отображаться компонент UserOrders
                <UserOrders token={token} onTabChange={handleTabChange} />
            ) : (
                // Контент заявок
                <>
                    {loading && page === 0 ? (
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
                            <div style={{ color: '#546e7a', fontSize: '1.1rem' }}>Загрузка заявок...</div>
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
                                <p style={{ margin: '0 0 0.5rem 0' }}>URL запроса: https://api.mos-hack.ru/api/applications/user?page=0&size=10&sort=createdAt,desc</p>
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
                    ) : applications.length === 0 ? (
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '4rem 2rem',
                            textAlign: 'center',
                            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)'
                        }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
                            <h2 style={{ color: '#1a237e', marginBottom: '1rem' }}>Заявок пока нет</h2>
                            <p style={{ color: '#546e7a', marginBottom: '2rem' }}>
                                У вас еще нет оформленных заявок. Посмотрите каталог проектов и оставьте заявку на понравившийся проект!
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
                                Перейти в каталог
                            </Link>
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
                                        <h2 style={{ color: '#1a237e', margin: 0 }}>Мои заявки</h2>
                                        <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                            Всего заявок: {totalElements}
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
                                            onClick={() => fetchApplications(page, pageSize)}
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
                                    {applications.map(application => (
                                        <div key={application.id} style={{
                                            border: '1px solid #e0e0e0',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            {/* Заголовок заявки */}
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
                                                        Заявка #{application.id}
                                                    </h3>
                                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#666' }}>
                                                        <span>📅 Создана: {formatDate(application.createdAt)}</span>
                                                        <span>🎯 ID проекта: {application.projectId || 'Не указан'}</span>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '20px',
                                                    background: getStatusColor(application.statusName),
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {getStatusText(application.statusName)}
                                                </div>
                                            </div>

                                            {/* Детали заявки */}
                                            <div style={{ padding: '1.5rem' }}>
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                                    gap: '1.5rem',
                                                    marginBottom: '1.5rem'
                                                }}>
                                                    {/* Контактные данные */}
                                                    <div>
                                                        <h4 style={{
                                                            color: '#37474f',
                                                            margin: '0 0 0.5rem 0',
                                                            fontSize: '1rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}>
                                                            {getContactIcon(application.contact)} Контактные данные
                                                        </h4>
                                                        <p style={{
                                                            color: '#546e7a',
                                                            margin: 0,
                                                            fontSize: '1.1rem',
                                                            fontWeight: 500,
                                                            wordBreak: 'break-all'
                                                        }}>
                                                            {application.contact || 'Не указаны'}
                                                        </p>
                                                    </div>

                                                    {/* Статус заявки */}
                                                    <div>
                                                        <h4 style={{
                                                            color: '#37474f',
                                                            margin: '0 0 0.5rem 0',
                                                            fontSize: '1rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}>
                                                            <span>📊</span> Статус заявки
                                                        </h4>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{
                                                                width: '10px',
                                                                height: '10px',
                                                                borderRadius: '50%',
                                                                background: getStatusColor(application.statusName)
                                                            }}></div>
                                                            <span style={{
                                                                color: '#546e7a',
                                                                fontSize: '1rem'
                                                            }}>
                                                                {getStatusText(application.statusName)}
                                                            </span>
                                                        </div>
                                                        {application.statusDescription && (
                                                            <p style={{
                                                                fontSize: '0.9rem',
                                                                color: '#666',
                                                                margin: '0.5rem 0 0 0',
                                                                fontStyle: 'italic'
                                                            }}>
                                                                {application.statusDescription}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Информация о менеджере */}
                                                    {application.managerId && (
                                                        <div>
                                                            <h4 style={{
                                                                color: '#37474f',
                                                                margin: '0 0 0.5rem 0',
                                                                fontSize: '1rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px'
                                                            }}>
                                                                <span>👔</span> Ответственный менеджер
                                                            </h4>
                                                            <p style={{ color: '#546e7a', margin: 0 }}>
                                                                id: {application.managerId}
                                                            </p>

                                                        </div>
                                                    )}
                                                </div>

                                                {/* Кнопки действий */}
                                                {application.projectId && (
                                                    <div style={{
                                                        display: 'flex',
                                                        gap: '1rem',
                                                        marginTop: '1.5rem',
                                                        paddingTop: '1rem',
                                                        borderTop: '1px solid #f0f0f0'
                                                    }}>
                                                        <Link
                                                            to={`/template/${application.projectId}`}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                padding: '10px 16px',
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                background: 'transparent',
                                                                color: '#2196F3',
                                                                textDecoration: 'none',
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
                                                        </Link>
                                                    </div>
                                                )}

                                                {/* Подсказка */}
                                                <div style={{
                                                    marginTop: '1rem',
                                                    padding: '0.75rem',
                                                    background: '#e8f5e9',
                                                    borderRadius: '6px',
                                                    fontSize: '0.85rem',
                                                    color: '#2E7D32'
                                                }}>
                                                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span>💡</span>
                                                        {application.statusName === 'created' ? 'Заявка создана и ожидает обработки менеджером' :
                                                            application.statusName === 'consideration' ? 'Заявка находится на рассмотрении' :
                                                                application.statusName === 'accepted' ? 'Заявка принята! Менеджер свяжется с вами для уточнения деталей' :
                                                                    application.statusName === 'rejected' ? 'К сожалению, заявка была отклонена' :
                                                                        'Менеджер свяжется с вами по указанным контактным данным'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
                                        onClick={() => handlePageChange(0)}
                                        disabled={page === 0 || loading}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            border: '1px solid #e0e0e0',
                                            background: page === 0 ? '#f5f5f5' : 'white',
                                            color: page === 0 ? '#999' : '#333',
                                            cursor: page === 0 || loading ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.3s ease',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        ⏮️ Первая
                                    </button>

                                    <button
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 0 || loading}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            border: '1px solid #e0e0e0',
                                            background: page === 0 ? '#f5f5f5' : 'white',
                                            color: page === 0 ? '#999' : '#333',
                                            cursor: page === 0 || loading ? 'not-allowed' : 'pointer',
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
                                            {page + 1}
                                        </span>
                                        <span>из</span>
                                        <span style={{ fontWeight: 600 }}>{totalPages}</span>
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page >= totalPages - 1 || loading}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            border: '1px solid #e0e0e0',
                                            background: page >= totalPages - 1 ? '#f5f5f5' : 'white',
                                            color: page >= totalPages - 1 ? '#999' : '#333',
                                            cursor: page >= totalPages - 1 || loading ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.3s ease',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        Вперед ▶️
                                    </button>

                                    <button
                                        onClick={() => handlePageChange(totalPages - 1)}
                                        disabled={page >= totalPages - 1 || loading}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            border: '1px solid #e0e0e0',
                                            background: page >= totalPages - 1 ? '#f5f5f5' : 'white',
                                            color: page >= totalPages - 1 ? '#999' : '#333',
                                            cursor: page >= totalPages - 1 || loading ? 'not-allowed' : 'pointer',
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