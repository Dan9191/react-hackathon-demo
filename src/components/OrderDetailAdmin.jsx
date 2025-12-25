import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getConfig } from '../config';

export default function OrderDetailAdmin({ token }) {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [statuses, setStatuses] = useState([]);
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddStatus, setShowAddStatus] = useState(false);
    const [showAddStage, setShowAddStage] = useState(false);
    const [newStatus, setNewStatus] = useState({ statusType: '', comment: '' });
    const [newStage, setNewStage] = useState({
        stageType: '',
        stageName: '',
        description: '',
        plannedEndDate: ''
    });

    useEffect(() => {
        if (token && orderId) {
            fetchOrderDetails();
        }
    }, [token, orderId]);

    const fetchOrderDetails = async () => {
        try {
            const { API_BASE_URL } = getConfig();

            // Основная информация о заказе
            const orderRes = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!orderRes.ok) throw new Error('Заказ не найден');
            const orderData = await orderRes.json();
            setOrder(orderData);

            // История статусов
            const statusRes = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (statusRes.ok) {
                const statusData = await statusRes.json();
                setStatuses(statusData);
            }

            // Все этапы
            const stagesRes = await fetch(`${API_BASE_URL}/api/orders/${orderId}/stages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (stagesRes.ok) {
                const stagesData = await stagesRes.json();
                setStages(stagesData);
            }

            setLoading(false);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            setLoading(false);
        }
    };

    const handleAddStatus = async () => {
        if (!newStatus.statusType.trim()) {
            alert('Выберите тип статуса');
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
                body: JSON.stringify(newStatus)
            });

            if (!response.ok) throw new Error('Ошибка добавления статуса');

            alert('Статус добавлен');
            setShowAddStatus(false);
            setNewStatus({ statusType: '', comment: '' });
            fetchOrderDetails();
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    };

    const handleAddStage = async () => {
        if (!newStage.stageName.trim()) {
            alert('Введите название этапа');
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
                    ...newStage,
                    plannedEndDate: newStage.plannedEndDate || new Date().toISOString()
                })
            });

            if (!response.ok) throw new Error('Ошибка добавления этапа');

            alert('Этап добавлен');
            setShowAddStage(false);
            setNewStage({
                stageType: '',
                stageName: '',
                description: '',
                plannedEndDate: ''
            });
            fetchOrderDetails();
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    };

    const handleUpdateStage = async (stageId, updates) => {
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

            alert('Этап обновлен');
            fetchOrderDetails();
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

    const getStageStatusColor = (status) => {
        switch (status) {
            case 'completed': return '#4CAF50';
            case 'in_progress': return '#FF9800';
            case 'delayed': return '#F44336';
            default: return '#9E9E9E';
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (!order) return <div className="error">Заказ не найден</div>;

    return (
        <div className="order-detail-admin">
            <div className="header-section">
                <button onClick={() => navigate(-1)} className="back-link">
                    ← Назад
                </button>
                <h1>📋 Заказ #{order.id}</h1>
            </div>

            {/* Основная информация */}
            <div className="order-overview">
                <div className="overview-card">
                    <h2>📊 Обзор заказа</h2>
                    <div className="overview-grid">
                        <div className="overview-item">
                            <span className="label">Клиент:</span>
                            <span className="value">{order.clientInfo?.fullName}</span>
                        </div>
                        <div className="overview-item">
                            <span className="label">Проект:</span>
                            <span className="value">{order.projectInfo?.title}</span>
                        </div>
                        <div className="overview-item">
                            <span className="label">Адрес:</span>
                            <span className="value">{order.address}</span>
                        </div>
                        <div className="overview-item">
                            <span className="label">Стоимость:</span>
                            <span className="value">{order.projectInfo?.basePrice} ₽</span>
                        </div>
                        <div className="overview-item">
                            <span className="label">Площадь:</span>
                            <span className="value">{order.projectInfo?.totalArea} м²</span>
                        </div>
                        <div className="overview-item">
                            <span className="label">Дата создания:</span>
                            <span className="value">
                                {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Текущий статус */}
                <div className="current-status-card">
                    <h3>Текущий статус</h3>
                    {order.currentStatus && (
                        <div className="status-display" style={{
                            borderLeft: `4px solid ${getStatusColor(order.currentStatus.statusType)}`
                        }}>
                            <div className="status-header">
                                <span className="status-type">
                                    {order.currentStatus.statusType === 'new' ? '🆕 Новый' :
                                        order.currentStatus.statusType === 'in_progress' ? '🔄 В работе' :
                                            order.currentStatus.statusType === 'completed' ? '✅ Завершен' :
                                                order.currentStatus.statusType === 'cancelled' ? '❌ Отменен' : order.currentStatus.statusType}
                                </span>
                                <span className="status-date">
                                    {new Date(order.currentStatus.createdAt).toLocaleDateString('ru-RU')}
                                </span>
                            </div>
                            <p className="status-comment">{order.currentStatus.comment}</p>
                            <p className="status-changed-by">
                                Изменил: {order.currentStatus.changedBy?.fullName || 'Система'}
                            </p>
                        </div>
                    )}
                    <button
                        onClick={() => setShowAddStatus(true)}
                        className="btn btn-outline"
                    >
                        ✏️ Изменить статус
                    </button>
                </div>
            </div>

            {/* Управление статусами */}
            <div className="management-section">
                <div className="section-header">
                    <h3>📈 История статусов</h3>
                    <button
                        onClick={() => setShowAddStatus(true)}
                        className="btn btn-primary"
                    >
                        ➕ Добавить статус
                    </button>
                </div>

                <div className="status-history">
                    {statuses.map(status => (
                        <div key={status.id} className="status-item" style={{
                            borderLeft: `3px solid ${getStatusColor(status.statusType)}`
                        }}>
                            <div className="status-item-header">
                                <span className="status-type">{status.statusType}</span>
                                <span className="status-date">
                                    {new Date(status.createdAt).toLocaleDateString('ru-RU HH:mm')}
                                </span>
                            </div>
                            <p className="status-comment">{status.comment}</p>
                            <p className="status-author">
                                Автор: {status.changedBy?.fullName || 'Система'}
                            </p>
                        </div>
                    ))}

                    {statuses.length === 0 && (
                        <p className="empty-message">Статусы еще не добавлены</p>
                    )}
                </div>
            </div>

            {/* Управление этапами */}
            <div className="management-section">
                <div className="section-header">
                    <h3>🏗️ Этапы строительства</h3>
                    <button
                        onClick={() => setShowAddStage(true)}
                        className="btn btn-primary"
                    >
                        ➕ Добавить этап
                    </button>
                </div>

                <div className="stages-grid">
                    {stages.map(stage => (
                        <div key={stage.id} className="stage-card">
                            <div className="stage-header">
                                <h4>{stage.stageName}</h4>
                                <span className="stage-type">{stage.stageType}</span>
                                <span className="stage-status" style={{
                                    background: getStageStatusColor(stage.status)
                                }}>
                                    {stage.status === 'completed' ? '✅ Завершен' :
                                        stage.status === 'in_progress' ? '🔄 В процессе' :
                                            stage.status === 'delayed' ? '⚠️ Задержан' : '⏸️ Не начат'}
                                </span>
                            </div>

                            <p className="stage-description">{stage.description}</p>

                            <div className="stage-dates">
                                <div className="date-item">
                                    <span className="date-label">Начало:</span>
                                    <span className="date-value">
                                        {new Date(stage.startDate).toLocaleDateString('ru-RU')}
                                    </span>
                                </div>
                                <div className="date-item">
                                    <span className="date-label">План завершения:</span>
                                    <span className="date-value">
                                        {new Date(stage.plannedEndDate).toLocaleDateString('ru-RU')}
                                    </span>
                                </div>
                                {stage.actualEndDate && (
                                    <div className="date-item">
                                        <span className="date-label">Факт завершения:</span>
                                        <span className="date-value">
                                            {new Date(stage.actualEndDate).toLocaleDateString('ru-RU')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="stage-progress">
                                <div className="progress-info">
                                    <span>Прогресс:</span>
                                    <span>{stage.progress || 0}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${stage.progress || 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="stage-actions">
                                {stage.status !== 'completed' && (
                                    <>
                                        <button
                                            onClick={() => handleUpdateStage(stage.id, {
                                                status: 'in_progress'
                                            })}
                                            className="btn btn-sm btn-outline"
                                        >
                                            🚀 Начать
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStage(stage.id, {
                                                progress: Math.min(100, (stage.progress || 0) + 25)
                                            })}
                                            className="btn btn-sm btn-primary"
                                        >
                                            📈 +25%
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStage(stage.id, {
                                                status: 'completed',
                                                actualEndDate: new Date().toISOString(),
                                                progress: 100
                                            })}
                                            className="btn btn-sm btn-success"
                                        >
                                            ✅ Завершить
                                        </button>
                                    </>
                                )}
                                {stage.status === 'completed' && (
                                    <span className="completed-text">Этап завершен</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {stages.length === 0 && (
                        <p className="empty-message">Этапы еще не добавлены</p>
                    )}
                </div>
            </div>

            {/* Текущий этап */}
            {order.currentStage && (
                <div className="current-stage-section">
                    <h3>🎯 Текущий активный этап</h3>
                    <div className="current-stage-card">
                        <div className="stage-highlight">
                            <h4>{order.currentStage.stageName}</h4>
                            <span className="stage-progress-highlight">
                                {order.currentStage.progress || 0}%
                            </span>
                        </div>
                        <p>{order.currentStage.description}</p>
                        <div className="stage-timeline">
                            <span>Начало: {new Date(order.currentStage.startDate).toLocaleDateString('ru-RU')}</span>
                            <span>План: {new Date(order.currentStage.plannedEndDate).toLocaleDateString('ru-RU')}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальные окна */}
            {showAddStatus && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>✏️ Добавить новый статус</h3>
                            <button onClick={() => setShowAddStatus(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Тип статуса:</label>
                                <select
                                    value={newStatus.statusType}
                                    onChange={(e) => setNewStatus({ ...newStatus, statusType: e.target.value })}
                                    className="form-control"
                                >
                                    <option value="">Выберите статус</option>
                                    <option value="new">🆕 Новый</option>
                                    <option value="in_progress">🔄 В работе</option>
                                    <option value="completed">✅ Завершен</option>
                                    <option value="cancelled">❌ Отменен</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Комментарий:</label>
                                <textarea
                                    value={newStatus.comment}
                                    onChange={(e) => setNewStatus({ ...newStatus, comment: e.target.value })}
                                    placeholder="Обоснование изменения статуса..."
                                    className="form-control"
                                    rows="3"
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    onClick={handleAddStatus}
                                    className="btn btn-primary"
                                >
                                    Добавить статус
                                </button>
                                <button
                                    onClick={() => setShowAddStatus(false)}
                                    className="btn btn-outline"
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showAddStage && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>🏗️ Добавить новый этап</h3>
                            <button onClick={() => setShowAddStage(false)}>×</button>
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
                                    onClick={handleAddStage}
                                    className="btn btn-primary"
                                >
                                    Добавить этап
                                </button>
                                <button
                                    onClick={() => setShowAddStage(false)}
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