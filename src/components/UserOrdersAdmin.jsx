import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getConfig } from '../config';

export default function UserOrdersAdmin({ token }) {
    const { userId } = useParams();
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showStageModal, setShowStageModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [newStage, setNewStage] = useState({
        stageType: '',
        stageName: '',
        description: '',
        plannedEndDate: ''
    });

    useEffect(() => {
        if (token && userId) {
            fetchUserAndOrders();
        }
    }, [token, userId]);

    const fetchUserAndOrders = async () => {
        try {
            const { API_BASE_URL } = getConfig();

            // Получаем пользователя
            const userRes = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!userRes.ok) throw new Error('Пользователь не найден');
            const userData = await userRes.json();
            setUser(userData);

            // Получаем заказы пользователя
            const ordersRes = await fetch(`${API_BASE_URL}/api/users/${userId}/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (ordersRes.ok) {
                const ordersData = await ordersRes.json();
                setOrders(ordersData);
            }

            setLoading(false);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    const fetchOrderDetails = async (orderId) => {
        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (err) {
            console.error('Ошибка загрузки деталей заказа:', err);
            return null;
        }
    };

    const handleAddStatus = async (orderId) => {
        if (!newStatus.trim()) {
            alert('Введите статус');
            return;
        }

        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    statusType: newStatus,
                    comment: 'Статус обновлен администратором'
                })
            });

            if (!response.ok) throw new Error('Ошибка обновления статуса');

            alert('Статус успешно обновлен');
            setShowStatusModal(false);
            setNewStatus('');
            fetchUserAndOrders();
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    };

    const handleAddStage = async (orderId) => {
        if (!newStage.stageName.trim() || !newStage.stageType.trim()) {
            alert('Заполните обязательные поля');
            return;
        }

        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/stages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    stageType: newStage.stageType,
                    stageName: newStage.stageName,
                    description: newStage.description,
                    plannedEndDate: newStage.plannedEndDate || new Date().toISOString()
                })
            });

            if (!response.ok) throw new Error('Ошибка добавления этапа');

            alert('Этап успешно добавлен');
            setShowStageModal(false);
            setNewStage({
                stageType: '',
                stageName: '',
                description: '',
                plannedEndDate: ''
            });
            fetchUserAndOrders();
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    };

    const handleUpdateStage = async (orderId, stageId, updates) => {
        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/stages/${stageId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) throw new Error('Ошибка обновления этапа');

            alert('Этап успешно обновлен');
            fetchUserAndOrders();
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    };

    const getStatusColor = (statusType) => {
        switch (statusType) {
            case 'new': return '#2196F3';
            case 'in_progress': return '#FF9800';
            case 'completed': return '#4CAF50';
            case 'cancelled': return '#F44336';
            default: return '#9E9E9E';
        }
    };

    const getStatusText = (statusType) => {
        switch (statusType) {
            case 'new': return 'Новый';
            case 'in_progress': return 'В работе';
            case 'completed': return 'Завершен';
            case 'cancelled': return 'Отменен';
            default: return statusType;
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!user) return <div className="error">Пользователь не найден</div>;

    return (
        <div className="user-orders-admin">
            <div className="header-section">
                <Link to="/admin" className="back-link">
                    ← Назад к панели
                </Link>
                <h1>📋 Заказы пользователя</h1>
                <div className="user-info-card">
                    <div className="user-avatar-large">
                        {user.fullName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <h2>{user.fullName}</h2>
                        <p>📧 {user.email}</p>
                        <p>📞 {user.phone || 'Не указан'}</p>
                        <p>🏠 Всего заказов: <strong>{orders.length}</strong></p>
                    </div>
                </div>
            </div>

            {/* Кнопка создания новой заявки */}
            <div className="create-application-section">
                <Link
                    to={`/admin/user/${userId}/create-application`}
                    className="btn btn-primary btn-large"
                >
                    ➕ Создать новую заявку
                </Link>
            </div>

            {/* Список заказов */}
            <div className="orders-list">
                {orders.map(order => (
                    <div key={order.id} className="order-card-admin">
                        <div className="order-header">
                            <div>
                                <h3>Заказ #{order.id} • {order.projectInfo?.title || 'Проект'}</h3>
                                <div className="order-meta">
                                    <span>📅 {new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
                                    <span>💰 {order.projectInfo?.basePrice || '0'} ₽</span>
                                    <span>📏 {order.projectInfo?.totalArea || '0'} м²</span>
                                </div>
                            </div>
                            <div className="status-badge" style={{
                                background: getStatusColor(order.currentStatus?.statusType)
                            }}>
                                {getStatusText(order.currentStatus?.statusType)}
                            </div>
                        </div>

                        <div className="order-body">
                            <div className="order-details">
                                <p><strong>📍 Адрес:</strong> {order.address}</p>
                                {order.currentStatus?.comment && (
                                    <p><strong>💬 Комментарий:</strong> {order.currentStatus.comment}</p>
                                )}
                            </div>

                            {/* Текущий статус */}
                            <div className="current-status">
                                <h4>📊 Текущий статус</h4>
                                {order.currentStatus && (
                                    <div className="status-item">
                                        <span>{order.currentStatus.comment}</span>
                                        <span className="status-date">
                                            {new Date(order.currentStatus.createdAt).toLocaleDateString('ru-RU')}
                                        </span>
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        setSelectedOrder(order);
                                        setShowStatusModal(true);
                                    }}
                                    className="btn btn-sm btn-outline"
                                >
                                    ✏️ Изменить статус
                                </button>
                            </div>

                            {/* Этапы строительства */}
                            <div className="stages-section">
                                <div className="section-header">
                                    <h4>🏗️ Этапы строительства</h4>
                                    <button
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setShowStageModal(true);
                                        }}
                                        className="btn btn-sm btn-primary"
                                    >
                                        ➕ Добавить этап
                                    </button>
                                </div>

                                {order.stages && order.stages.length > 0 ? (
                                    <div className="stages-list">
                                        {order.stages.map(stage => (
                                            <div key={stage.id} className="stage-item">
                                                <div className="stage-header">
                                                    <div>
                                                        <h5>{stage.stageName}</h5>
                                                        <p className="stage-type">{stage.stageType}</p>
                                                    </div>
                                                    <span className={`stage-status ${stage.status}`}>
                                                        {stage.status === 'completed' ? '✅' :
                                                            stage.status === 'in_progress' ? '🔄' :
                                                                stage.status === 'delayed' ? '⚠️' : '⏸️'}
                                                        {stage.status === 'completed' ? 'Завершен' :
                                                            stage.status === 'in_progress' ? 'В процессе' :
                                                                stage.status === 'delayed' ? 'Задержан' : 'Не начат'}
                                                    </span>
                                                </div>

                                                <p className="stage-description">{stage.description}</p>

                                                <div className="stage-dates">
                                                    <span>Начало: {new Date(stage.startDate).toLocaleDateString('ru-RU')}</span>
                                                    <span>План: {new Date(stage.plannedEndDate).toLocaleDateString('ru-RU')}</span>
                                                    {stage.actualEndDate && (
                                                        <span>Факт: {new Date(stage.actualEndDate).toLocaleDateString('ru-RU')}</span>
                                                    )}
                                                </div>

                                                <div className="stage-progress">
                                                    <div className="progress-bar">
                                                        <div
                                                            className="progress-fill"
                                                            style={{ width: `${stage.progress || 0}%` }}
                                                        ></div>
                                                    </div>
                                                    <span>{stage.progress || 0}%</span>
                                                </div>

                                                <div className="stage-actions">
                                                    <button
                                                        onClick={() => handleUpdateStage(order.id, stage.id, {
                                                            status: 'completed',
                                                            actualEndDate: new Date().toISOString()
                                                        })}
                                                        className="btn btn-sm btn-success"
                                                    >
                                                        ✅ Завершить
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStage(order.id, stage.id, {
                                                            progress: Math.min(100, (stage.progress || 0) + 25)
                                                        })}
                                                        className="btn btn-sm btn-primary"
                                                    >
                                                        📈 Обновить прогресс
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-stages">Этапы еще не добавлены</p>
                                )}
                            </div>

                            {/* Действия с заказом */}
                            <div className="order-actions">
                                <button
                                    onClick={() => fetchOrderDetails(order.id)}
                                    className="btn btn-outline"
                                >
                                    🔍 Подробнее
                                </button>
                                <Link
                                    to={`/template/${order.projectInfo?.id}`}
                                    className="btn btn-outline"
                                >
                                    👁️ Посмотреть проект
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}

                {orders.length === 0 && (
                    <div className="empty-state">
                        <div>📭</div>
                        <h3>Нет заказов</h3>
                        <p>У этого пользователя пока нет оформленных заказов</p>
                    </div>
                )}
            </div>

            {/* Модальные окна */}
            {showStatusModal && selectedOrder && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>✏️ Изменить статус заказа #{selectedOrder.id}</h3>
                            <button onClick={() => setShowStatusModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Новый статус:</label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="form-control"
                                >
                                    <option value="">Выберите статус</option>
                                    <option value="new">Новый</option>
                                    <option value="in_progress">В работе</option>
                                    <option value="completed">Завершен</option>
                                    <option value="cancelled">Отменен</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button
                                    onClick={() => handleAddStatus(selectedOrder.id)}
                                    className="btn btn-primary"
                                >
                                    Сохранить
                                </button>
                                <button
                                    onClick={() => setShowStatusModal(false)}
                                    className="btn btn-outline"
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showStageModal && selectedOrder && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>🏗️ Добавить этап для заказа #{selectedOrder.id}</h3>
                            <button onClick={() => setShowStageModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Тип этапа:</label>
                                <input
                                    type="text"
                                    value={newStage.stageType}
                                    onChange={(e) => setNewStage({ ...newStage, stageType: e.target.value })}
                                    placeholder="foundation, walls, roof..."
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Название этапа:</label>
                                <input
                                    type="text"
                                    value={newStage.stageName}
                                    onChange={(e) => setNewStage({ ...newStage, stageName: e.target.value })}
                                    placeholder="Заливка фундамента"
                                    className="form-control"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Описание:</label>
                                <textarea
                                    value={newStage.description}
                                    onChange={(e) => setNewStage({ ...newStage, description: e.target.value })}
                                    placeholder="Подготовка основания, установка опалубки..."
                                    className="form-control"
                                    rows="3"
                                />
                            </div>
                            <div className="form-group">
                                <label>Плановая дата завершения:</label>
                                <input
                                    type="date"
                                    value={newStage.plannedEndDate}
                                    onChange={(e) => setNewStage({ ...newStage, plannedEndDate: e.target.value })}
                                    className="form-control"
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    onClick={() => handleAddStage(selectedOrder.id)}
                                    className="btn btn-primary"
                                >
                                    Добавить этап
                                </button>
                                <button
                                    onClick={() => setShowStageModal(false)}
                                    className="btn btn-outline"
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}