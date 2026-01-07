import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getConfig } from '../config';
import { jwtDecode } from 'jwt-decode';

export default function AdminDashboard({ token }) {
    const [activeTab, setActiveTab] = useState('new-applications');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [adminId, setAdminId] = useState(null);

    // Данные для вкладок
    const [newApplications, setNewApplications] = useState([]);
    const [inProgressApplications, setInProgressApplications] = useState([]);
    const [processedApplications, setProcessedApplications] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);

    // Кэш для пользователей и проектов
    const [userCache, setUserCache] = useState({});
    const [projectCache, setProjectCache] = useState({});

    // Пагинация
    const [currentPage, setCurrentPage] = useState({
        'new-applications': 0,
        'in-progress': 0,
        'processed': 0,
        'orders': 0,
        'users': 0
    });
    const [totalPages, setTotalPages] = useState({
        'new-applications': 0,
        'in-progress': 0,
        'processed': 0,
        'orders': 0,
        'users': 0
    });
    const pageSize = 10;

    // Функция для загрузки данных пользователя
    const loadUserData = useCallback(async (userId) => {
        if (!userId) return null;

        // Проверяем кэш
        if (userCache[userId]) {
            return userCache[userId];
        }

        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const userData = await response.json();
                // Сохраняем в кэш
                setUserCache(prev => ({ ...prev, [userId]: userData }));
                return userData;
            }
            return null;
        } catch (err) {
            console.error('Ошибка загрузки пользователя:', err);
            return null;
        }
    }, [token, userCache]);

    // Функция для загрузки данных проекта
    const loadProjectData = useCallback(async (projectId) => {
        if (!projectId) return null;

        // Проверяем кэш
        if (projectCache[projectId]) {
            return projectCache[projectId];
        }

        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/templates/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const projectData = await response.json();
                // Сохраняем в кэш
                setProjectCache(prev => ({ ...prev, [projectId]: projectData }));
                return projectData;
            }
            return null;
        } catch (err) {
            console.error('Ошибка загрузки проекта:', err);
            return null;
        }
    }, [token, projectCache]);

    // Функция для обогащения заявки данными пользователя и проекта
    const enrichApplication = useCallback(async (application) => {
        const [userData, projectData] = await Promise.all([
            loadUserData(application.creatorId),
            loadProjectData(application.projectId)
        ]);

        return {
            ...application,
            userData: userData || null,
            projectData: projectData || null
        };
    }, [loadUserData, loadProjectData]);

    // Функция для обогащения массива заявок
    const enrichApplications = useCallback(async (applications) => {
        const enriched = await Promise.all(
            applications.map(app => enrichApplication(app))
        );
        return enriched;
    }, [enrichApplication]);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userId = decoded.userId || decoded.sub;
                setAdminId(userId);
                //console.log('Admin ID from token:', userId);
            } catch (err) {
                console.error('Ошибка декодирования токена:', err);
            }

            loadDataForTab(activeTab, 0);
        }
    }, [token]);

    // Загрузка данных для конкретной вкладки
    const loadDataForTab = async (tab, page = 0) => {
        setLoading(true);
        setError('');

        try {
            const { API_BASE_URL } = getConfig();

            switch (tab) {
                case 'new-applications':
                    await loadNewApplications(page);
                    break;
                case 'in-progress':
                    if (adminId) {
                        await loadInProgressApplications(page);
                    }
                    break;
                case 'processed':
                    await loadProcessedApplications(page);
                    break;
                case 'orders':
                    await loadOrders(page);
                    break;
                case 'users':
                    await loadUsers(page);
                    break;
                default:
                    break;
            }
        } catch (err) {
            console.error(`Ошибка загрузки данных для вкладки ${tab}:`, err);
            setError('Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    };

    // Загрузка новых заявок (статус: created)
    const loadNewApplications = async (page = 0) => {
        const { API_BASE_URL } = getConfig();
        const response = await fetch(`${API_BASE_URL}/api/applications?page=${page}&size=${pageSize}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Ошибка ${response.status}`);

        const data = await response.json();
        // Фильтруем только заявки со статусом "created"
        const rawApplications = data.content ?
            data.content.filter(app => app.statusName === 'created') :
            (Array.isArray(data) ? data.filter(app => app.statusName === 'created') : []);

        // Обогащаем данные пользователями и проектами
        const enrichedApplications = await enrichApplications(rawApplications);

        //console.log('Новые заявки с полными данными:', enrichedApplications);
        setNewApplications(enrichedApplications);
        if (data.totalPages !== undefined) {
            setTotalPages(prev => ({ ...prev, 'new-applications': data.totalPages }));
        }
    };

    // Загрузка заявок в работе (статус: consideration и managerId === adminId)
    const loadInProgressApplications = async (page = 0) => {
        const { API_BASE_URL } = getConfig();
        const response = await fetch(`${API_BASE_URL}/api/applications?page=${page}&size=${pageSize}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Ошибка ${response.status}`);

        const data = await response.json();
        // Фильтруем заявки со статусом "consideration" и где managerId соответствует текущему админу
        const rawApplications = data.content ?
            data.content.filter(app =>
                app.statusName === 'consideration' &&
                app.managerId === adminId
            ) :
            (Array.isArray(data) ? data.filter(app =>
                app.statusName === 'consideration' &&
                app.managerId === adminId
            ) : []);

        // Обогащаем данные пользователями и проектами
        const enrichedApplications = await enrichApplications(rawApplications);

        //console.log('Заявки в работе с полными данными:', enrichedApplications);
        setInProgressApplications(enrichedApplications);
        if (data.totalPages !== undefined) {
            setTotalPages(prev => ({ ...prev, 'in-progress': data.totalPages }));
        }
    };

    // Загрузка обработанных заявок (статус: rejected или accepted)
    const loadProcessedApplications = async (page = 0) => {
        const { API_BASE_URL } = getConfig();
        const response = await fetch(`${API_BASE_URL}/api/applications?page=${page}&size=${pageSize}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Ошибка ${response.status}`);

        const data = await response.json();
        // Фильтруем только заявки со статусом "rejected" или "accepted"
        const rawApplications = data.content ?
            data.content.filter(app =>
                app.statusName === 'rejected' ||
                app.statusName === 'accepted'
            ) :
            (Array.isArray(data) ? data.filter(app =>
                app.statusName === 'rejected' ||
                app.statusName === 'accepted'
            ) : []);

        // Обогащаем данные пользователями и проектами
        const enrichedApplications = await enrichApplications(rawApplications);

        //console.log('Обработанные заявки с полными данными:', enrichedApplications);
        setProcessedApplications(enrichedApplications);
        if (data.totalPages !== undefined) {
            setTotalPages(prev => ({ ...prev, 'processed': data.totalPages }));
        }
    };

    // Загрузка заказов (из принятых заявок)
    const loadOrders = async (page = 0) => {
        const { API_BASE_URL } = getConfig();

        try {
            // Загружаем все заказы (без фильтрации по пользователю)
            const response = await fetch(`${API_BASE_URL}/api/orders/manager?page=${page}&size=${pageSize}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Загруженные заказы:', data);

                let ordersData = [];
                if (data.items) {
                    ordersData = data.items;
                } else if (Array.isArray(data)) {
                    ordersData = data;
                } else if (data.content) {
                    ordersData = data.content;
                }

                setOrders(ordersData);

                if (data.totalPages !== undefined) {
                    setTotalPages(prev => ({ ...prev, 'orders': data.totalPages }));
                }
            } else {
                console.warn('Не удалось загрузить заказы:', response.status);
                setOrders([]);
            }
        } catch (err) {
            console.error('Ошибка загрузки заказов:', err);
            setOrders([]);
        }
    };

    // Загрузка пользователей
    const loadUsers = async (page = 0) => {
        const { API_BASE_URL } = getConfig();
        const response = await fetch(`${API_BASE_URL}/api/users?page=${page}&size=${pageSize}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Ошибка ${response.status}`);

        const data = await response.json();
        setUsers(data.content || data);
        if (data.totalPages !== undefined) {
            setTotalPages(prev => ({ ...prev, 'users': data.totalPages }));
        }
    };

    // Обработчики действий
    const handleTakeApplication = async (applicationId) => {
        if (!window.confirm('Взять заявку в работу?')) return;

        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/take`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Ошибка взятия заявки:', errorText);
                throw new Error(`Ошибка ${response.status}: ${errorText}`);
            }

            const updatedApp = await response.json();
            //console.log('Заявка взята в работу:', updatedApp);
            alert('Заявка взята в работу!');

            // Обновляем данные
            setNewApplications(newApplications.filter(app => app.id !== applicationId));
            await loadInProgressApplications(currentPage['in-progress']);
        } catch (err) {
            console.error('Ошибка при взятии заявки:', err);
            alert('Ошибка: ' + err.message);
        }
    };

    const handleRejectApplication = async (applicationId) => {
        if (!window.confirm('Отклонить заявку?')) return;

        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/reject`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Ошибка отклонения заявки:', errorText);
                throw new Error(`Ошибка ${response.status}: ${errorText}`);
            }

            const updatedApp = await response.json();
            //console.log('Заявка отклонена:', updatedApp);
            alert('Заявка отклонена!');

            // Обновляем данные
            setInProgressApplications(inProgressApplications.filter(app => app.id !== applicationId));
            await loadProcessedApplications(currentPage['processed']);
        } catch (err) {
            console.error('Ошибка при отклонении заявки:', err);
            alert('Ошибка: ' + err.message);
        }
    };

    const handleAcceptApplication = async (applicationId) => {
        if (!window.confirm('Принять выполнение заявки и создать заказ?')) return;

        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/accept`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Ошибка принятия заявки:', errorText);
                //console.log(response);
                throw new Error(`Ошибка ${response.status}: ${errorText}`);
            }

            const updatedApp = await response.json();
            //console.log('Заявка принята, заказ создан:', updatedApp);
            alert('Заявка принята! Заказ создан.');

            // Обновляем данные
            setInProgressApplications(inProgressApplications.filter(app => app.id !== applicationId));
            await Promise.all([
                loadProcessedApplications(currentPage['processed']),
                loadOrders(currentPage['orders'])
            ]);
        } catch (err) {
            console.error('Ошибка при принятии заявки:', err);
            alert('Ошибка: ' + err.message);
        }
    };

    // Смена вкладки
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        loadDataForTab(tab, 0);
        setCurrentPage(prev => ({ ...prev, [tab]: 0 }));
    };

    // Пагинация
    const handlePageChange = (tab, page) => {
        setCurrentPage(prev => ({ ...prev, [tab]: page }));
        loadDataForTab(tab, page);
    };

    // Вспомогательные функции
    const getStatusColor = (status) => {
        switch (status) {
            case 'created': return '#2196F3'; // синий
            case 'consideration': return '#FF9800'; // оранжевый
            case 'accepted': return '#4CAF50'; // зеленый
            case 'rejected': return '#F44336'; // красный
            default: return '#9E9E9E';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'created': return 'Новая';
            case 'consideration': return 'В рассмотрении';
            case 'accepted': return 'Принята';
            case 'rejected': return 'Отклонена';
            default: return status;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    // Получаем данные для активной вкладки
    const getCurrentData = () => {
        switch (activeTab) {
            case 'new-applications': return newApplications;
            case 'in-progress': return inProgressApplications;
            case 'processed': return processedApplications;
            case 'orders': return orders;
            case 'users': return users;
            default: return [];
        }
    };
    //console.log(users)

    if (!token) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '4rem',
                maxWidth: '500px',
                margin: '0 auto'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
                <h2 style={{ color: '#1a237e', marginBottom: '1rem' }}>Требуется авторизация</h2>
                <p style={{ color: '#546e7a', marginBottom: '2rem' }}>
                    Для доступа к панели администратора необходимо войти в систему
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
    function getTypeId(user) {
        // Проверяем, существует ли объект user
        if (!user) {
            return null;
        }

        // Проверяем, существует ли свойство type
        if (!user.type) {
            return null;
        }

        // Возвращаем type.id
        return user.type.id;
    }

    return (
        <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '2rem 1rem',
            minHeight: '100vh'
        }}>
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>

            {/* Заголовок */}
            <div style={{
                textAlign: 'center',
                marginBottom: '2rem',
                animation: 'fadeIn 0.5s ease'
            }}>
                <Link to="/" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: '#2196F3',
                    textDecoration: 'none',
                    marginBottom: '1rem',
                    fontSize: '0.95rem'
                }}>
                    <span style={{ fontSize: '1.2rem', marginRight: '5px' }}>←</span> На главную
                </Link>

                <h1 style={{
                    fontSize: '2.5rem',
                    color: '#1a237e',
                    marginBottom: '0.5rem',
                    fontWeight: 700
                }}>
                    👑 Панель управления менеджера
                </h1>
                <p style={{
                    fontSize: '1.1rem',
                    color: '#546e7a',
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    Управление заявками и заказами клиентов
                </p>
            </div>

            {/* Табы */}
            <div style={{
                display: 'flex',
                overflowX: 'auto',
                gap: '0.5rem',
                marginBottom: '2rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid #e0e0e0'
            }}>
                <button
                    onClick={() => handleTabChange('new-applications')}
                    style={{
                        padding: '12px 20px',
                        border: 'none',
                        background: activeTab === 'new-applications' ? '#2196F3' : '#f5f5f5',
                        color: activeTab === 'new-applications' ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    📝 Новые заявки
                    {newApplications.length > 0 && (
                        <span style={{
                            background: activeTab === 'new-applications' ? 'white' : '#2196F3',
                            color: activeTab === 'new-applications' ? '#2196F3' : 'white',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.8rem'
                        }}>
                            {newApplications.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => handleTabChange('in-progress')}
                    style={{
                        padding: '12px 20px',
                        border: 'none',
                        background: activeTab === 'in-progress' ? '#FF9800' : '#f5f5f5',
                        color: activeTab === 'in-progress' ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    🔄 В работе
                    {inProgressApplications.length > 0 && (
                        <span style={{
                            background: activeTab === 'in-progress' ? 'white' : '#FF9800',
                            color: activeTab === 'in-progress' ? '#FF9800' : 'white',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.8rem'
                        }}>
                            {inProgressApplications.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => handleTabChange('processed')}
                    style={{
                        padding: '12px 20px',
                        border: 'none',
                        background: activeTab === 'processed' ? '#9E9E9E' : '#f5f5f5',
                        color: activeTab === 'processed' ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    📊 Обработанные
                    {processedApplications.length > 0 && (
                        <span style={{
                            background: activeTab === 'processed' ? 'white' : '#9E9E9E',
                            color: activeTab === 'processed' ? '#9E9E9E' : 'white',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.8rem'
                        }}>
                            {processedApplications.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => handleTabChange('orders')}
                    style={{
                        padding: '12px 20px',
                        border: 'none',
                        background: activeTab === 'orders' ? '#4CAF50' : '#f5f5f5',
                        color: activeTab === 'orders' ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    🏗️ Заказы
                    {orders.length > 0 && (
                        <span style={{
                            background: activeTab === 'orders' ? 'white' : '#4CAF50',
                            color: activeTab === 'orders' ? '#4CAF50' : 'white',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.8rem'
                        }}>
                            {orders.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => handleTabChange('users')}
                    style={{
                        padding: '12px 20px',
                        border: 'none',
                        background: activeTab === 'users' ? '#9C27B0' : '#f5f5f5',
                        color: activeTab === 'users' ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    👥 Пользователи
                    {users.length > 0 && (
                        <span style={{
                            background: activeTab === 'users' ? 'white' : '#9C27B0',
                            color: activeTab === 'users' ? '#9C27B0' : 'white',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.8rem'
                        }}>
                            {users.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Контент вкладок */}
            <div>
                {loading && (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: '#546e7a'
                    }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            border: '4px solid #e3f2fd',
                            borderTopColor: '#2196F3',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 1rem'
                        }}></div>
                        Загрузка данных...
                    </div>
                )}

                {error && !loading && (
                    <div style={{
                        background: '#ffebee',
                        color: '#c62828',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        textAlign: 'center',
                        marginBottom: '2rem'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                        <p>{error}</p>
                        <button
                            onClick={() => loadDataForTab(activeTab, currentPage[activeTab])}
                            style={{
                                padding: '8px 16px',
                                background: '#c62828',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                marginTop: '1rem'
                            }}
                        >
                            Попробовать снова
                        </button>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {/* Вкладка: Новые заявки */}
                        {activeTab === 'new-applications' && (
                            <div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1.5rem'
                                }}>
                                    <h2 style={{ color: '#1a237e', margin: 0 }}>📝 Новые заявки</h2>
                                    <button
                                        onClick={() => loadDataForTab('new-applications', currentPage['new-applications'])}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'transparent',
                                            color: '#2196F3',
                                            border: '2px solid #2196F3',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        🔄 Обновить
                                    </button>
                                </div>

                                {newApplications.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '3rem',
                                        background: '#f8f9fa',
                                        borderRadius: '12px',
                                        border: '2px dashed #e0e0e0'
                                    }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                                        <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>Нет новых заявок</h3>
                                        <p style={{ color: '#999' }}>Все заявки обработаны</p>
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                                        gap: '1.5rem'
                                    }}>
                                        {newApplications.map(app => (
                                            <div key={app.id} style={{
                                                background: 'white',
                                                borderRadius: '12px',
                                                padding: '1.5rem',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                                borderLeft: '4px solid #2196F3'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    marginBottom: '1rem'
                                                }}>
                                                    <div>
                                                        <h3 style={{ margin: '0 0 5px 0', color: '#1a237e' }}>
                                                            Заявка #{app.id}
                                                        </h3>
                                                        {app.userData && (
                                                            <>
                                                                <p style={{ margin: '2px 0', color: '#666', fontSize: '0.9rem' }}>
                                                                    👤 Имя: <strong>{app.userData.firstName || 'Не указано'}</strong>
                                                                </p>
                                                                <p style={{ margin: '2px 0', color: '#666', fontSize: '0.9rem' }}>
                                                                    👤 Фамилия: <strong>{app.userData.lastName || 'Не указано'}</strong>
                                                                </p>
                                                                <p style={{ margin: '2px 0', color: '#666', fontSize: '0.9rem' }}>
                                                                    📧 Email: <strong>{app.userData.email || 'Не указан'}</strong>
                                                                </p>
                                                            </>
                                                        )}

                                                        {app.projectData && (
                                                            <div>
                                                                <Link to={`/template/${app.projectData.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                                                                    <p style={{ margin: '2px 0', color: '#666', fontSize: '0.9rem' }}>

                                                                        🏠 Проект: <strong>{app.projectData.title || 'Без названия'}</strong>
                                                                        {app.projectData.areaM2 && (

                                                                            <span> ({app.projectData.areaM2} м²)</span>
                                                                        )}

                                                                    </p>
                                                                </Link>
                                                            </div>

                                                        )}

                                                        <p style={{ margin: '2px 0', color: '#666', fontSize: '0.9rem' }}>
                                                            Контакт: <strong>{app.contact || 'Не указан'}</strong>
                                                        </p>
                                                    </div>
                                                    <span style={{
                                                        padding: '4px 12px',
                                                        background: '#2196F3',
                                                        color: 'white',
                                                        borderRadius: '20px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600
                                                    }}>
                                                        Новая
                                                    </span>
                                                </div>

                                                <div style={{ marginBottom: '1.5rem' }}>
                                                    <div style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr',
                                                        gap: '0.75rem'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: '#666' }}>📅 Создана:</span>
                                                            <span style={{ fontWeight: 500 }}>{formatDate(app.createdAt)}</span>
                                                        </div>
                                                        {app.phone && (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ color: '#666' }}>📞 Телефон:</span>
                                                                <span style={{ fontWeight: 500 }}>{app.phone}</span>
                                                            </div>
                                                        )}
                                                        {app.address && (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ color: '#666' }}>📍 Адрес:</span>
                                                                <span style={{ fontWeight: 500 }}>{app.address}</span>
                                                            </div>
                                                        )}
                                                        {app.description && (
                                                            <div>
                                                                <div style={{ color: '#666', marginBottom: '5px' }}>💬 Описание:</div>
                                                                <div style={{
                                                                    background: '#f5f5f5',
                                                                    padding: '10px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '0.9rem'
                                                                }}>
                                                                    {app.description}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    gap: '1rem'
                                                }}>
                                                    <button
                                                        onClick={() => handleTakeApplication(app.id)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '10px',
                                                            background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            fontWeight: 600,
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                                    >
                                                        Взять в работу
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Вкладка: Заявки в работе */}
                        {activeTab === 'in-progress' && (
                            <div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1.5rem'
                                }}>
                                    <h2 style={{ color: '#1a237e', margin: 0 }}>🔄 Заявки в работе</h2>
                                    <button
                                        onClick={() => loadDataForTab('in-progress', currentPage['in-progress'])}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'transparent',
                                            color: '#FF9800',
                                            border: '2px solid #FF9800',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        🔄 Обновить
                                    </button>
                                </div>

                                {inProgressApplications.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '3rem',
                                        background: '#f8f9fa',
                                        borderRadius: '12px',
                                        border: '2px dashed #e0e0e0'
                                    }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                                        <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>Нет заявок в работе</h3>
                                        <p style={{ color: '#999' }}>Все заявки обработаны или ожидают действий</p>
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                                        gap: '1.5rem'
                                    }}>
                                        {inProgressApplications.map(app => (
                                            <div key={app.id} style={{
                                                background: 'white',
                                                borderRadius: '12px',
                                                padding: '1.5rem',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                                borderLeft: '4px solid #FF9800'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    marginBottom: '1rem'
                                                }}>
                                                    <div>
                                                        <h3 style={{ margin: '0 0 5px 0', color: '#1a237e' }}>
                                                            Заявка #{app.id}
                                                        </h3>
                                                        {app.userData && (
                                                            <div>
                                                                <p style={{ margin: '2px 0', color: '#666', fontSize: '0.9rem' }}>
                                                                    Контакт: <strong>{app.contact}</strong>
                                                                </p>
                                                                <p style={{ margin: '2px 0', color: '#666', fontSize: '0.9rem' }}>
                                                                    Клиент: <strong>{app.userData.firstName} {app.userData.lastName}</strong>
                                                                </p>
                                                            </div>
                                                        )}
                                                        {app.projectData && (
                                                            <div>
                                                                <Link to={`/template/${app.projectData.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                                                                    <p style={{ margin: '2px 0', color: '#666', fontSize: '0.9rem' }}>
                                                                        Проект: <strong>{app.projectData.title || 'Без названия'}</strong>
                                                                    </p>
                                                                </Link>
                                                            </div>

                                                        )}
                                                    </div>
                                                    <span style={{
                                                        padding: '4px 12px',
                                                        background: '#FF9800',
                                                        color: 'white',
                                                        borderRadius: '20px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600
                                                    }}>
                                                        В рассмотрении
                                                    </span>
                                                </div>

                                                <div style={{ marginBottom: '1.5rem' }}>
                                                    <div style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr',
                                                        gap: '0.75rem'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: '#666' }}>📅 Взята в работу:</span>
                                                            <span style={{ fontWeight: 500 }}>{formatDate(app.createdAt)}</span>
                                                        </div>
                                                        {app.userData && (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ color: '#666' }}>📧 Email:</span>
                                                                <span style={{ fontWeight: 500 }}>{app.userData.email}</span>
                                                            </div>
                                                        )}
                                                        {app.phone && (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ color: '#666' }}>📞 Телефон:</span>
                                                                <span style={{ fontWeight: 500 }}>{app.phone}</span>
                                                            </div>
                                                        )}
                                                        {app.address && (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ color: '#666' }}>📍 Адрес:</span>
                                                                <span style={{ fontWeight: 500 }}>{app.address}</span>
                                                            </div>
                                                        )}
                                                        {app.description && (
                                                            <div>
                                                                <div style={{ color: '#666', marginBottom: '5px' }}>💬 Описание:</div>
                                                                <div style={{
                                                                    background: '#f5f5f5',
                                                                    padding: '10px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '0.9rem'
                                                                }}>
                                                                    {app.description}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div style={{
                                                    display: 'flex',
                                                    gap: '1rem'
                                                }}>
                                                    <button
                                                        onClick={() => handleAcceptApplication(app.id)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '10px',
                                                            background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            fontWeight: 600,
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                                    >
                                                        Принять заявку
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectApplication(app.id)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '10px',
                                                            background: 'linear-gradient(135deg, #F44336, #D32F2F)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            fontWeight: 600,
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                                    >
                                                        Отклонить
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Вкладка: Обработанные заявки */}
                        {activeTab === 'processed' && (
                            <div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1.5rem'
                                }}>
                                    <h2 style={{ color: '#1a237e', margin: 0 }}>📊 Обработанные заявки</h2>
                                    <button
                                        onClick={() => loadDataForTab('processed', currentPage['processed'])}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'transparent',
                                            color: '#9E9E9E',
                                            border: '2px solid #9E9E9E',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        🔄 Обновить
                                    </button>
                                </div>

                                {processedApplications.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '3rem',
                                        background: '#f8f9fa',
                                        borderRadius: '12px',
                                        border: '2px dashed #e0e0e0'
                                    }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                                        <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>Нет обработанных заявок</h3>
                                        <p style={{ color: '#999' }}>Заявки будут появляться здесь после обработки</p>
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                                        gap: '1.5rem'
                                    }}>
                                        {processedApplications.map(app => (
                                            <div key={app.id} style={{
                                                background: 'white',
                                                borderRadius: '12px',
                                                padding: '1.5rem',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                                borderLeft: `4px solid ${app.statusName === 'accepted' ? '#4CAF50' : '#F44336'}`
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    marginBottom: '1rem'
                                                }}>
                                                    <div>
                                                        <h3 style={{ margin: '0 0 5px 0', color: '#1a237e' }}>
                                                            Заявка #{app.id}
                                                        </h3>

                                                        {app.userData && (
                                                            <p style={{ margin: '2px 0', color: '#666', fontSize: '0.9rem' }}>
                                                                Клиент: <strong>{app.userData.firstName} {app.userData.lastName}</strong>
                                                            </p>
                                                        )}
                                                        {app.projectData && (
                                                            <p style={{ margin: '2px 0', color: '#666', fontSize: '0.9rem' }}>
                                                                Проект: <strong>{app.projectData.title || 'Без названия'}</strong>
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span style={{
                                                        padding: '4px 12px',
                                                        background: app.statusName === 'accepted' ? '#4CAF50' : '#F44336',
                                                        color: 'white',
                                                        borderRadius: '20px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600
                                                    }}>
                                                        {app.statusName === 'accepted' ? 'Принята' : 'Отклонена'}
                                                    </span>
                                                </div>

                                                <div style={{ marginBottom: '1.5rem' }}>
                                                    <div style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr',
                                                        gap: '0.75rem'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: '#666' }}>📅 Обработана:</span>
                                                            <span style={{ fontWeight: 500 }}>{formatDate(app.updatedAt)}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: '#666' }}>👨‍💼 Менеджер:</span>
                                                            <span style={{ fontWeight: 500 }}>{app.managerName || 'Вы'}</span>
                                                        </div>
                                                        {app.userData && (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ color: '#666' }}>📧 Email клиента:</span>
                                                                <span style={{ fontWeight: 500 }}>{app.userData.email}</span>
                                                            </div>
                                                        )}
                                                        {app.statusName === 'accepted' && (
                                                            <div style={{
                                                                background: '#e8f5e9',
                                                                padding: '10px',
                                                                borderRadius: '6px',
                                                                color: '#2E7D32',
                                                                fontWeight: 600,
                                                                textAlign: 'center'
                                                            }}>
                                                                Заказ создан
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Вкладка: Заказы */}
                        {activeTab === 'orders' && (
                            <div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1.5rem'
                                }}>
                                    <h2 style={{ color: '#1a237e', margin: 0 }}>🏗️ Заказы</h2>
                                    <button
                                        onClick={() => loadDataForTab('orders', currentPage['orders'])}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'transparent',
                                            color: '#4CAF50',
                                            border: '2px solid #4CAF50',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        🔄 Обновить
                                    </button>
                                </div>

                                {orders.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '3rem',
                                        background: '#f8f9fa',
                                        borderRadius: '12px',
                                        border: '2px dashed #e0e0e0'
                                    }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏗️</div>
                                        <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>Нет заказов</h3>
                                        <p style={{ color: '#999' }}>Заказы появятся здесь после принятия заявок</p>
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                                        gap: '1.5rem'
                                    }}>
                                        {orders.map(order => (
                                            <div key={order.id} style={{
                                                background: 'white',
                                                borderRadius: '12px',
                                                padding: '1.5rem',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                                borderLeft: '4px solid #4CAF50'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    marginBottom: '1rem'
                                                }}>
                                                    <div>
                                                        <h3 style={{ margin: '0 0 5px 0', color: '#1a237e' }}>
                                                            Заказ #{order.id}
                                                        </h3>
                                                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                                                            Клиент: <strong>
                                                                {order.clientInfo.fullName||
                                                                    order.client?.fullName ||
                                                                    (order.client?.firstName && order.client?.lastName ?
                                                                        `${order.client.firstName} ${order.client.lastName}` :
                                                                        'Не указан')}
                                                            </strong>
                                                        </p>
                                                    </div>
                                                    {order.currentStatus?.statusType && (() => {
                                                        const status = order.currentStatus?.statusType.toLowerCase();
                                                        return (
                                                            <span style={{
                                                                padding: '4px 12px',
                                                                background: status === 'closed' ? '#4CAF50' :
                                                                    status === 'new' ? '#FF9800' : '#2196F3',
                                                                color: 'white',
                                                                borderRadius: '20px',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 600
                                                            }}>
                                                                {status === 'closed' ? 'Завершен' :
                                                                    status === 'new' ? 'Новый' : 'В работе'}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>

                                                <div style={{ marginBottom: '1.5rem' }}>
                                                    <div style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr',
                                                        gap: '0.75rem'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: '#666' }}>📅 Создан:</span>
                                                            <span style={{ fontWeight: 500 }}>{formatDate(order.createdAt)}</span>
                                                        </div>
                                                        {order.project && (
                                                            <div>
                                                                <div style={{ color: '#666', marginBottom: '5px' }}>🏠 Проект:</div>
                                                                <div style={{
                                                                    background: '#f5f5f5',
                                                                    padding: '10px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '0.9rem'
                                                                }}>
                                                                    {order.project.title} ({order.project.areaM2} м²)
                                                                </div>
                                                            </div>
                                                        )}
                                                        {order.currentStage && (
                                                            <div>
                                                                <div style={{ color: '#666', marginBottom: '5px' }}>📋 Текущий этап:</div>
                                                                <div style={{
                                                                    background: '#e3f2fd',
                                                                    padding: '10px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '0.9rem',
                                                                    color: '#1976D2'
                                                                }}>
                                                                    {order.currentStage.stageName}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {order.address && (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ color: '#666' }}>📍 Адрес строительства:</span>
                                                                <span style={{ fontWeight: 500 }}>{order.address}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Link
                                                        to={`/admin/orders/${order.id}`}
                                                        style={{
                                                            padding: '10px 20px',
                                                            background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                                                            color: 'white',
                                                            textDecoration: 'none',
                                                            borderRadius: '8px',
                                                            fontWeight: 600,
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                                    >
                                                        Управление заказом
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Вкладка: Пользователи */}
                        {activeTab === 'users' && (
                            <div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1.5rem'
                                }}>
                                    <h2 style={{ color: '#1a237e', margin: 0 }}>👥 Пользователи</h2>
                                    <button
                                        onClick={() => loadDataForTab('users', currentPage['users'])}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'transparent',
                                            color: '#9C27B0',
                                            border: '2px solid #9C27B0',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        🔄 Обновить
                                    </button>
                                </div>

                                {users.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '3rem',
                                        background: '#f8f9fa',
                                        borderRadius: '12px',
                                        border: '2px dashed #e0e0e0'
                                    }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                                        <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>Нет пользователей</h3>
                                        <p style={{ color: '#999' }}>Пользователи не найдены</p>
                                    </div>
                                ) : (
                                    <div style={{
                                        background: 'white',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                    }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: '#f5f5f5' }}>
                                                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>ID</th>
                                                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Имя</th>
                                                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Email</th>
                                                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Роль</th>

                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map(user => (
                                                    <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                        <td style={{ padding: '1rem' }}>{user.id}</td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <div style={{
                                                                    width: '36px',
                                                                    height: '36px',
                                                                    borderRadius: '50%',
                                                                    background: '#2196F3',
                                                                    color: 'white',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    {user.fullName?.[0]?.toUpperCase() || user.firstName?.[0]?.toUpperCase() || 'U'}
                                                                </div>
                                                                <span>{user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Не указано'}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>{user.email || 'Не указан'}</td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <span style={{
                                                                padding: '4px 12px',
                                                                background: getTypeId(user) !== 1 ? '#9C27B0' : '#2196F3',
                                                                color: 'white',
                                                                borderRadius: '20px',
                                                                fontSize: '0.8rem'
                                                            }}>
                                                                {getTypeId(user) === 1 ? 'Пользователь' : 'Менеджер'}
                                                            </span>
                                                        </td>

                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Пагинация */}
            {!loading && !error && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '2rem',
                    gap: '0.5rem'
                }}>
                    {currentPage[activeTab] > 0 && (
                        <button
                            onClick={() => handlePageChange(activeTab, currentPage[activeTab] - 1)}
                            style={{
                                padding: '8px 16px',
                                background: 'transparent',
                                color: '#2196F3',
                                border: '1px solid #2196F3',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            ← Назад
                        </button>
                    )}

                    <span style={{
                        padding: '8px 16px',
                        background: '#f5f5f5',
                        borderRadius: '6px',
                        color: '#666'
                    }}>
                        Страница {currentPage[activeTab] + 1} {totalPages[activeTab] > 0 && `из ${totalPages[activeTab]}`}
                    </span>

                    {currentPage[activeTab] < totalPages[activeTab] - 1 && (
                        <button
                            onClick={() => handlePageChange(activeTab, currentPage[activeTab] + 1)}
                            style={{
                                padding: '8px 16px',
                                background: 'transparent',
                                color: '#2196F3',
                                border: '1px solid #2196F3',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Вперед →
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}