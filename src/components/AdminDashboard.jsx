import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getConfig } from '../config';

export default function AdminDashboard({ token }) {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (token) {
            fetchUsers();
            fetchApplications();
        }
    }, [token]);

    const fetchUsers = async () => {
        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error(`Ошибка ${response.status}`);
            
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            console.error('Ошибка загрузки пользователей:', err);
            setError('Не удалось загрузить список пользователей');
        }
    };

    const fetchApplications = async () => {
        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/applications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error(`Ошибка ${response.status}`);
            
            const data = await response.json();
            setApplications(data);
            setLoading(false);
        } catch (err) {
            console.error('Ошибка загрузки заявок:', err);
            setLoading(false);
        }
    };

    const handleTakeApplication = async (applicationId) => {
        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/take`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error(`Ошибка ${response.status}`);
            
            alert('Заявка взята в работу');
            fetchApplications();
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    };

    const handleRejectApplication = async (applicationId) => {
        if (!window.confirm('Вы уверены, что хотите отклонить эту заявку?')) return;
        
        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/reject`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error(`Ошибка ${response.status}`);
            
            alert('Заявка отклонена');
            fetchApplications();
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    };

    const handleAcceptApplication = async (applicationId) => {
        if (!window.confirm('Принять выполненную заявку?')) return;
        
        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/accept`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error(`Ошибка ${response.status}`);
            
            alert('Заявка принята');
            fetchApplications();
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return '#2196F3';
            case 'in_progress': return '#FF9800';
            case 'completed': return '#4CAF50';
            case 'cancelled': return '#F44336';
            case 'taken': return '#9C27B0';
            default: return '#9E9E9E';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'new': return 'Новая';
            case 'in_progress': return 'В работе';
            case 'completed': return 'Завершена';
            case 'cancelled': return 'Отклонена';
            case 'taken': return 'Взята в работу';
            default: return status;
        }
    };

    if (!token) {
        return (
            <div className="auth-required">
                <div>🔒</div>
                <h2>Требуется авторизация</h2>
                <p>Для доступа к панели администратора необходимо войти в систему</p>
                <Link to="/" className="btn btn-primary">На главную</Link>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <Link to="/" className="back-link">
                    ← На главную
                </Link>
                <h1>👑 Панель администратора</h1>
                <p>Управление пользователями, заявками и заказами</p>
            </div>

            {/* Табы */}
            <div className="admin-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    👥 Пользователи ({users.length})
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('applications')}
                >
                    📋 Заявки ({applications.length})
                </button>
            </div>

            {/* Контент табов */}
            {activeTab === 'users' && (
                <div className="admin-content">
                    <div className="card">
                        <div className="card-header">
                            <h2>👥 Список пользователей</h2>
                            <p>Всего пользователей: {users.length}</p>
                        </div>
                        
                        <div className="table-responsive">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Имя</th>
                                        <th>Email</th>
                                        <th>Роль</th>
                                        <th>Заказов</th>
                                        <th>Заявок</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>
                                            <td>
                                                <div className="user-info">
                                                    <div className="user-avatar-small">
                                                        {user.fullName?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                    <span>{user.fullName || 'Не указано'}</span>
                                                </div>
                                            </td>
                                            <td>{user.email || 'Не указан'}</td>
                                            <td>
                                                <span className={`role-badge ${user.role === 'ADMIN' ? 'admin' : 'user'}`}>
                                                    {user.role === 'ADMIN' ? '👑 Админ' : '👤 Пользователь'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="count-badge">{user.orderCount || 0}</span>
                                            </td>
                                            <td>
                                                <span className="count-badge">{user.applicationCount || 0}</span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    {user.orderCount > 0 && (
                                                        <Link 
                                                            to={`/admin/orders/${user.id}`}
                                                            className="btn btn-sm btn-outline"
                                                        >
                                                            📋 Заказы
                                                        </Link>
                                                    )}
                                                    <Link 
                                                        to={`/admin/user/${user.id}/applications`}
                                                        className="btn btn-sm btn-primary"
                                                    >
                                                        ➕ Заявка
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'applications' && (
                <div className="admin-content">
                    <div className="card">
                        <div className="card-header">
                            <h2>📋 Заявки на заказы</h2>
                            <button 
                                onClick={fetchApplications}
                                className="btn btn-outline"
                            >
                                🔄 Обновить
                            </button>
                        </div>
                        
                        <div className="applications-grid">
                            {applications.map(app => (
                                <div key={app.id} className="application-card">
                                    <div className="app-header">
                                        <div>
                                            <h3>Заявка #{app.id}</h3>
                                            <p className="app-client">
                                                Клиент: <strong>{app.clientName}</strong>
                                            </p>
                                        </div>
                                        <div className={`status-badge`} style={{
                                            background: getStatusColor(app.status)
                                        }}>
                                            {getStatusText(app.status)}
                                        </div>
                                    </div>
                                    
                                    <div className="app-details">
                                        <div className="detail-row">
                                            <span>📞 Телефон:</span>
                                            <span>{app.phone || 'Не указан'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span>📍 Адрес:</span>
                                            <span>{app.address}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span>📅 Дата:</span>
                                            <span>{new Date(app.createdAt).toLocaleDateString('ru-RU')}</span>
                                        </div>
                                        {app.description && (
                                            <div className="detail-row">
                                                <span>💬 Описание:</span>
                                                <span>{app.description}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="app-actions">
                                        {app.status === 'new' && (
                                            <>
                                                <button 
                                                    onClick={() => handleTakeApplication(app.id)}
                                                    className="btn btn-success"
                                                >
                                                    ✅ Взять в работу
                                                </button>
                                                <button 
                                                    onClick={() => handleRejectApplication(app.id)}
                                                    className="btn btn-danger"
                                                >
                                                    ❌ Отклонить
                                                </button>
                                            </>
                                        )}
                                        
                                        {app.status === 'taken' && (
                                            <button 
                                                onClick={() => handleAcceptApplication(app.id)}
                                                className="btn btn-primary"
                                            >
                                                ✅ Принять выполнение
                                            </button>
                                        )}
                                        
                                        {app.status === 'completed' && (
                                            <span className="completed-text">✅ Заявка выполнена</span>
                                        )}
                                        
                                        {app.status === 'cancelled' && (
                                            <span className="cancelled-text">❌ Заявка отклонена</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            
                            {applications.length === 0 && (
                                <div className="empty-state">
                                    <div>📭</div>
                                    <h3>Нет заявок</h3>
                                    <p>Пока что не было подано ни одной заявки</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}