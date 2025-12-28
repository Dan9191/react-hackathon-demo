import React, { useState, useEffect, useRef } from 'react';
import { getConfig } from '../config';

export default function OrderConstruction({ token, orderId }) {
    const [stages, setStages] = useState([]);
    const [activeCount, setActiveCount] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Состояния для чата
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    
    // Состояния для камер
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState(null);
    
    const messagesEndRef = useRef(null);
    const chatIntervalRef = useRef(null);

    useEffect(() => {
        fetchStages();
        fetchChatMessages();
        fetchCameras();
        
        // Настраиваем интервал для обновления чата каждые 5 секунд
        chatIntervalRef.current = setInterval(fetchChatMessages, 5000);
        
        return () => {
            if (chatIntervalRef.current) {
                clearInterval(chatIntervalRef.current);
            }
        };
    }, [orderId, token]);

    const fetchStages = async () => {
        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(
                `${API_BASE_URL}/api/orders/${orderId}/stages`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            setStages(Array.isArray(data.stages) ? data.stages : []);
            setActiveCount(data.activeCount || 0);
            setCompletedCount(data.completedCount || 0);
        } catch (err) {
            console.error('Ошибка загрузки этапов:', err);
            setError('Не удалось загрузить этапы строительства');
        } finally {
            setLoading(false);
        }
    };

    const fetchChatMessages = async () => {
        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(
                `${API_BASE_URL}/api/orders/${orderId}/chatMessages`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            setMessages(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Ошибка загрузки сообщений:', err);
        }
    };

    const fetchCameras = async () => {
        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(
                `${API_BASE_URL}/api/orders/${orderId}/webCameras`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            setCameras(Array.isArray(data) ? data : []);
            if (data.length > 0 && !selectedCamera) {
                setSelectedCamera(data[0]);
            }
        } catch (err) {
            console.error('Ошибка загрузки камер:', err);
        }
    };

    const fetchCameraDetails = async (cameraId) => {
        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(
                `${API_BASE_URL}/api/orders/${orderId}/webCameras/${cameraId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (err) {
            console.error('Ошибка загрузки деталей камеры:', err);
            return null;
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        setChatLoading(true);
        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(
                `${API_BASE_URL}/api/orders/${orderId}/chatMessages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newMessage)
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            setNewMessage('');
            fetchChatMessages(); // Обновляем чат
        } catch (err) {
            console.error('Ошибка отправки сообщения:', err);
            alert('Не удалось отправить сообщение');
        } finally {
            setChatLoading(false);
        }
    };

    const getStageStatusColor = (status) => {
        if (!status) return '#9E9E9E';
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case 'not_started': return '#757575';
            case 'in_progress': return '#FF9800';
            case 'completed': return '#4CAF50';
            case 'delayed': return '#F44336';
            default: return '#9E9E9E';
        }
    };

    const getStageStatusText = (status) => {
        if (!status) return 'Не начат';
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case 'not_started': return 'Не начат';
            case 'in_progress': return 'В работе';
            case 'completed': return 'Завершен';
            case 'delayed': return 'Задержан';
            default: return status;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Не указано';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    };

    const calculateProgress = (stage) => {
        if (!stage) return 0;
        if (stage.progress !== undefined) {
            return Math.min(Math.max(stage.progress, 0), 100);
        }
        
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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid #e3f2fd',
                    borderTopColor: '#2196F3',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                }}></div>
                <p style={{ color: '#666', marginTop: '1rem' }}>Загрузка информации о строительстве...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#F44336' }}>
                <p>{error}</p>
                <button
                    onClick={fetchStages}
                    style={{
                        padding: '8px 16px',
                        background: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Повторить попытку
                </button>
            </div>
        );
    }

    return (
        <div style={{ marginTop: '1.5rem' }}>
            {/* Заголовок и статистика */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ color: '#1a237e', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🏗️</span> Ход строительства
                </h3>
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196F3' }}>
                            {stages.length}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>Всего этапов</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FF9800' }}>
                            {activeCount}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>Активных</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4CAF50' }}>
                            {completedCount}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>Завершено</div>
                    </div>
                </div>
            </div>

            {/* Двухколоночный макет */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                '@media (maxWidth: 992px)': {
                    gridTemplateColumns: '1fr'
                }
            }}>
                {/* Левая колонка: Этапы строительства */}
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <h4 style={{ color: '#37474f', marginBottom: '1rem' }}>Этапы строительства</h4>
                    
                    {stages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                            <p>Нет данных об этапах строительства</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {stages.map(stage => {
                                const progress = calculateProgress(stage);
                                const isActive = stage.status === 'in_progress';
                                const isCompleted = stage.status === 'completed';

                                return (
                                    <div
                                        key={stage.id}
                                        style={{
                                            border: `2px solid ${isActive ? '#FF9800' : isCompleted ? '#4CAF50' : '#e0e0e0'}`,
                                            borderRadius: '8px',
                                            padding: '1rem',
                                            background: isActive ? '#FFF3E0' : isCompleted ? '#F1F8E9' : 'white'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <div>
                                                <h5 style={{ color: '#1a237e', margin: '0 0 0.25rem 0' }}>
                                                    {stage.stageName}
                                                </h5>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                                                    <span style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        background: getStageStatusColor(stage.status),
                                                        color: 'white',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {getStageStatusText(stage.status)}
                                                    </span>
                                                    <span style={{ color: '#666', fontSize: '0.85rem' }}>
                                                        {stage.stageType}
                                                    </span>
                                                </div>
                                            </div>
                                            {stage.createdBy && (
                                                <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#666' }}>
                                                    <div>{stage.createdBy.fullName}</div>
                                                    <div style={{ color: '#999' }}>{stage.createdBy.role}</div>
                                                </div>
                                            )}
                                        </div>

                                        <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
                                            {stage.description || 'Описание отсутствует'}
                                        </p>

                                        {/* Прогресс бар */}
                                        {stage.status === 'in_progress' && (
                                            <div style={{ marginBottom: '1rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>
                                                    <span>Прогресс: {progress}%</span>
                                                    {stage.progress !== undefined && (
                                                        <span>{stage.progress}%</span>
                                                    )}
                                                </div>
                                                <div style={{
                                                    width: '100%',
                                                    height: '6px',
                                                    background: '#e0e0e0',
                                                    borderRadius: '3px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${progress}%`,
                                                        height: '100%',
                                                        background: stage.status === 'delayed' ? '#F44336' : '#2196F3',
                                                        borderRadius: '3px',
                                                        transition: 'width 0.3s ease'
                                                    }}></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Даты этапа */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                            gap: '0.5rem',
                                            fontSize: '0.8rem',
                                            color: '#666'
                                        }}>
                                            <div>
                                                <strong>Начало:</strong><br />
                                                {formatDate(stage.startDate)}
                                            </div>
                                            <div>
                                                <strong>План окончания:</strong><br />
                                                {formatDate(stage.plannedEndDate)}
                                            </div>
                                            {stage.actualEndDate && (
                                                <div>
                                                    <strong>Факт окончания:</strong><br />
                                                    {formatDate(stage.actualEndDate)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Правая колонка: Чат и камеры */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                }}>
                    {/* Чат */}
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <h4 style={{ color: '#37474f', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>💬</span> Чат проекта
                        </h4>
                        
                        <div style={{
                            flex: 1,
                            overflow: 'auto',
                            padding: '1rem',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            background: '#f9f9f9',
                            minHeight: '300px',
                            maxHeight: '400px'
                        }}>
                            {messages.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
                                    Нет сообщений. Начните общение!
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {messages.map(message => {
                                        const isCurrentUser = message.userId === localStorage.getItem('userId');
                                        return (
                                            <div
                                                key={message.id}
                                                style={{
                                                    alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                                                    maxWidth: '80%'
                                                }}
                                            >
                                                <div style={{
                                                    background: isCurrentUser ? '#2196F3' : '#e0e0e0',
                                                    color: isCurrentUser ? 'white' : '#333',
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '16px',
                                                    borderBottomRightRadius: isCurrentUser ? '4px' : '16px',
                                                    borderBottomLeftRadius: isCurrentUser ? '16px' : '4px'
                                                }}>
                                                    <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                                        <strong>{message.userName}</strong>
                                                        <span style={{ opacity: 0.7, marginLeft: '8px' }}>
                                                            {formatDate(message.createdAt)}
                                                        </span>
                                                    </div>
                                                    <div>{message.message}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Введите сообщение..."
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '20px',
                                    fontSize: '14px'
                                }}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={chatLoading || !newMessage.trim()}
                                style={{
                                    padding: '10px 20px',
                                    background: chatLoading ? '#ccc' : '#2196F3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '20px',
                                    cursor: chatLoading ? 'not-allowed' : 'pointer',
                                    minWidth: '80px'
                                }}
                            >
                                {chatLoading ? '...' : 'Отправить'}
                            </button>
                        </div>
                    </div>

                    {/* Камеры */}
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <h4 style={{ color: '#37474f', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>📹</span> Онлайн-камеры
                        </h4>
                        
                        {cameras.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                <p>Нет доступных камер</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                                        Выберите камеру:
                                    </label>
                                    <select
                                        value={selectedCamera?.id || ''}
                                        onChange={(e) => {
                                            const camera = cameras.find(c => c.id == e.target.value);
                                            setSelectedCamera(camera);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        {cameras.map(camera => (
                                            <option key={camera.id} value={camera.id}>
                                                {camera.name} ({camera.ip}:{camera.port})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedCamera && (
                                    <div style={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            background: '#f5f5f5',
                                            padding: '0.5rem 1rem',
                                            borderBottom: '1px solid #e0e0e0',
                                            fontSize: '0.9rem',
                                            color: '#666'
                                        }}>
                                            {selectedCamera.name}
                                        </div>
                                        <div style={{
                                            aspectRatio: '16/9',
                                            background: '#000',
                                            position: 'relative'
                                        }}>
                                            {selectedCamera.streamUrl ? (
                                                <iframe
                                                    src={selectedCamera.streamUrl}
                                                    title={selectedCamera.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        border: 'none'
                                                    }}
                                                    allow="camera; microphone"
                                                />
                                            ) : (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    color: '#999',
                                                    textAlign: 'center'
                                                }}>
                                                    <div style={{ fontSize: '3rem' }}>📹</div>
                                                    <div>Трансляция не доступна</div>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{
                                            padding: '0.75rem 1rem',
                                            background: '#fafafa',
                                            fontSize: '0.85rem',
                                            color: '#666',
                                            display: 'flex',
                                            justifyContent: 'space-between'
                                        }}>
                                            <span>IP: {selectedCamera.ip}:{selectedCamera.port}</span>
                                            <button
                                                onClick={() => fetchCameraDetails(selectedCamera.id)}
                                                style={{
                                                    padding: '4px 8px',
                                                    background: 'transparent',
                                                    border: '1px solid #2196F3',
                                                    color: '#2196F3',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                Обновить
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <style jsx="true">{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @media (max-width: 992px) {
                    .construction-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}