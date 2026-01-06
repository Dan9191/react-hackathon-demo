
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getConfig } from '../config';

export default function OrderManagement({ token }) {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('info');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Данные заказа
    const [order, setOrder] = useState(null);
    const [statuses, setStatuses] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [stages, setStages] = useState([]);
    const [availableStatuses, setAvailableStatuses] = useState([]);
    const [cameras, setCameras] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [userInfo, setUserInfo] = useState(null);
    const [lastMessageId, setLastMessageId] = useState(null);
    const [isPolling, setIsPolling] = useState(true);
    const [downloadingDocs, setDownloadingDocs] = useState({});

    // Формы
    const [newStatus, setNewStatus] = useState({
        statusType: '',
        comment: ''
    });
    const [newDocument, setNewDocument] = useState({
        type: 'contract',
        title: '',
        description: '',
        fileContent: null,
        fileName: ''
    });
    const [newStage, setNewStage] = useState({
        stageType: 'SITE_PREPARATION',
        description: '',
        plannedEndDate: '',
        progress: 0
    });
    const [updateStages, setUpdateStages] = useState({});

    const [editAddress, setEditAddress] = useState({
        address: '',
        isEditing: false
    });
    const [newCamera, setNewCamera] = useState({
        name: '',
        ip: '',
        port: ''
    });
    const [editCamera, setEditCamera] = useState({
        id: null,
        name: '',
        ip: '',
        port: ''
    });

    const chatContainerRef = useRef(null);
    const pollingIntervalRef = useRef(null);

    // Загрузка данных заказа
    useEffect(() => {
        if (token && orderId) {
            loadOrderData();
        } else {
            setLoading(false);
            setError('Требуется авторизация или не указан ID заказа');
        }
    }, [token, orderId]);

    // Загружаем информацию о пользователе из токена
    useEffect(() => {
        if (token) {
            try {
                // Декодируем JWT токен для получения информации о пользователе
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserInfo({
                    id: payload.sub || payload.userId,
                    name: payload.name || payload.username || 'Пользователь',
                    role: payload.role || 'admin'
                });
            } catch (err) {
                console.error('Ошибка декодирования токена:', err);
                setUserInfo({
                    id: 'unknown',
                    name: 'Пользователь',
                    role: 'admin'
                });
            }
        }
    }, [token]);

    // Запускаем и останавливаем опрос сообщений
    useEffect(() => {
        if (isPolling) {
            startPolling();
        } else {
            stopPolling();
        }

        return () => {
            stopPolling();
        };
    }, [isPolling]);

    // Функция для запуска опроса
    const startPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        pollingIntervalRef.current = setInterval(() => {
            checkForNewMessages();
        }, 5000); // Проверка каждые 5 секунд
    };

    // Функция для остановки опроса
    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    // Функция для проверки новых сообщений
    const checkForNewMessages = async () => {
        try {
            const { API_BASE_URL } = getConfig();
            
            // Если есть последнее известное сообщение, проверяем только новые
            let url = `${API_BASE_URL}/api/orders/${orderId}/chatMessages`;
            if (lastMessageId) {
                url += `?since=${lastMessageId}`;
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Ошибка проверки сообщений: ${response.status}`);
            }

            const newMessages = await response.json();
            
            if (Array.isArray(newMessages) && newMessages.length > 0) {
                // Получаем ID последнего сообщения
                const latestMessageId = newMessages[newMessages.length - 1].id;
                
                // Обновляем состояние только если получили новые сообщения
                setChatMessages(prev => {
                    // Создаем Set существующих ID сообщений для быстрой проверки
                    const existingIds = new Set(prev.map(msg => msg.id));
                    
                    // Фильтруем только действительно новые сообщения
                    const trulyNewMessages = newMessages.filter(msg => !existingIds.has(msg.id));
                    
                    // Если нет новых сообщений, возвращаем старое состояние
                    if (trulyNewMessages.length === 0) {
                        return prev;
                    }
                    
                    // Обновляем ID последнего сообщения
                    setLastMessageId(latestMessageId);
                    
                    // Возвращаем объединенный массив сообщений
                    return [...prev, ...trulyNewMessages];
                });
            }
        } catch (err) {
            console.error('Ошибка при проверке новых сообщений:', err);
            // Не останавливаем опрос при ошибке, просто логируем
        }
    };

    const loadOrderData = async () => {
        setLoading(true);
        setError('');
        try {

            // Загружаю информацию о заказе - так как камеры доступны только на этапе строительства
            const orderData = await loadOrderInfo();

            // Получаю текущий статус - должен быть строительство
            const currentStatus = orderData?.currentStatus?.statusType?.toLowerCase() || 'new';
            console.log('Текущий статус заказа:', currentStatus);

            // Загружаю остальные данные параллельно
            await Promise.all([
                loadOrderStatuses(),
                loadOrderDocuments(),
                loadOrderStages(),
                loadAvailableStatuses(),
                loadChatMessages() // Загружаем сообщения чата всегда
            ]);

            // Загружаю камеры если статус "construction"
            if (currentStatus === 'construction') {
                await loadCameras();
            }
        } catch (err) {
            console.error('Ошибка загрузки данных заказа:', err);
            setError('Не удалось загрузить данные заказа: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Функции для работы с чатом
    const loadChatMessages = async () => {
        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/chatMessages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Ошибка загрузки сообщений: ${response.status}`);
            }

            const data = await response.json();
            const messages = Array.isArray(data) ? data : [];
            
            setChatMessages(messages);
            
            // Сохраняем ID последнего сообщения
            if (messages.length > 0) {
                const latestMessageId = messages[messages.length - 1].id;
                setLastMessageId(latestMessageId);
            }
            
            // Прокручиваем вниз после загрузки сообщений
            setTimeout(() => {
                if (chatContainerRef.current) {
                    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                }
            }, 100);
            
            return messages;
        } catch (err) {
            console.error('Ошибка загрузки сообщений чата:', err);
            setChatMessages([]);
            return [];
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const { API_BASE_URL } = getConfig();
            const messageData = {
                message: newMessage.trim(),
                userId: userInfo?.id || 'unknown',
                userName: userInfo?.name || 'Пользователь',
                userRole: userInfo?.role || 'admin'
            };

            console.log('Отправка сообщения:', messageData);

            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/chatMessages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ошибка ${response.status}: ${errorText}`);
            }

            const sentMessage = await response.json();
            console.log('Сообщение отправлено:', sentMessage);
            
            // Добавляем сообщение в локальное состояние
            setChatMessages(prev => [...prev, sentMessage]);
            setNewMessage('');
            
            // Обновляем ID последнего сообщения
            setLastMessageId(sentMessage.id);
            
            // Прокручиваем вниз
            setTimeout(() => {
                if (chatContainerRef.current) {
                    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                }
            }, 100);
        } catch (err) {
            console.error('Ошибка отправки сообщения:', err);
            alert('Ошибка отправки сообщения: ' + err.message);
        }
    };

    // Функция для принудительной проверки сообщений
    const forceCheckMessages = async () => {
        await checkForNewMessages();
    };

    // Останавливаем опрос при переходе на другую вкладку и запускаем при возвращении на вкладку чата
    useEffect(() => {
        if (activeTab === 'chat') {
            setIsPolling(true);
        } else {
            setIsPolling(false);
        }
    }, [activeTab]);

    const loadOrderInfo = async () => {
        const { API_BASE_URL } = getConfig();
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Ошибка загрузки информации: ${response.status}`);
        }

        const data = await response.json();
        setOrder(data);
        // Автоматически выбираем вкладку в зависимости от статуса
        setActiveTabByStatus(data.currentStatus?.statusType);
        console.log(data);
        return data;
    };

    const loadAvailableStatuses = async () => {
        // Загружаем доступные статусы в зависимости от текущего статуса
        const currentStatus = order?.currentStatus?.statusType?.toLowerCase();
        let statusList = [];

        switch (currentStatus) {
            case 'new':
                statusList = [
                    { value: 'documentation', label: 'Документирование' },
                    { value: 'construction', label: 'Строительство' }
                ];
                break;
            case 'documentation':
                statusList = [
                    { value: 'construction', label: 'Строительство' },
                    { value: 'new', label: 'Новый' }
                ];
                break;
            case 'construction':
                statusList = [
                    { value: 'completion', label: 'Завершение' },
                    { value: 'documentation', label: 'Документирование' }
                ];
                break;
            case 'completion':
                statusList = [
                    { value: 'closed', label: 'Закрыт' },
                    { value: 'construction', label: 'Строительство' }
                ];
                break;
            default:
                statusList = [
                    { value: 'documentation', label: 'Документирование' },
                    { value: 'construction', label: 'Строительство' },
                    { value: 'completion', label: 'Завершение' },
                    { value: 'closed', label: 'Закрыт' }
                ];
        }

        setAvailableStatuses(statusList);
        return statusList;
    };

    const setActiveTabByStatus = (statusType) => {
        if (!statusType) return;

        const status = statusType.toLowerCase();
        switch (status) {
            case 'new':
                setActiveTab('info');
                break;
            case 'documentation':
                setActiveTab('documents');
                break;
            case 'construction':
                setActiveTab('construction');
                break;
            case 'completion':
                setActiveTab('completion-info');
                break;
            case 'closed':
                setActiveTab('closed');
                break;
            default:
                setActiveTab('info');
        }
    };

    const loadOrderStatuses = async () => {
        const { API_BASE_URL } = getConfig();
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Ошибка загрузки статусов: ${response.status}`);
        }

        const data = await response.json();
        console.log(data.statuses);
        setStatuses(Array.isArray(data.statuses) ? data.statuses : []);
        return data.statuses;
    };

    const loadOrderDocuments = async () => {
        const { API_BASE_URL } = getConfig();
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/documents`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Ошибка загрузки документов: ${response.status}`);
        }

        const data = await response.json();
        console.log('Documents', data);

        // Использую функцию для получения только последних версий
        const allDocuments = Array.isArray(data) ? data : [];
        const latestDocuments = getLatestDocumentVersions(allDocuments);

        setDocuments(latestDocuments);
        return latestDocuments;
    };

    const loadOrderStages = async () => {
        const { API_BASE_URL } = getConfig();
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/stages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Ошибка загрузки этапов: ${response.status}`);
        }

        const data = await response.json();
        console.log(data.stages);
        setStages(Array.isArray(data.stages) ? data.stages : []);
        return data.stages;
    };

    // Функции для работы с камерами
    const loadCameras = async () => {
        const { API_BASE_URL } = getConfig();
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/webCameras`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Ошибка загрузки камер: ${response.status}`);
        }

        const data = await response.json();
        setCameras(Array.isArray(data) ? data : []);
        return data;
    };

    const handleAddCamera = async (e) => {
        e.preventDefault();
        if (!window.confirm('Добавить новую камеру?')) return;

        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/webCameras`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCamera)
            });

            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${await response.text()}`);
            }

            alert('Камера успешно добавлена!');
            setNewCamera({ name: '', ip: '', port: '' });
            await loadCameras();
        } catch (err) {
            console.error('Ошибка добавления камеры:', err);
            alert('Ошибка: ' + err.message);
        }
    };

    const handleUpdateCamera = async (cameraId) => {
        if (!window.confirm('Обновить информацию о камере?')) return;

        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/webCameras/${cameraId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: editCamera.name,
                    ip: editCamera.ip,
                    port: editCamera.port
                })
            });

            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${await response.text()}`);
            }

            alert('Камера успешно обновлена!');
            setEditCamera({ id: null, name: '', ip: '', port: '' });
            await loadCameras();
        } catch (err) {
            console.error('Ошибка обновления камеры:', err);
            alert('Ошибка: ' + err.message);
        }
    };

    const handleDeleteCamera = async (cameraId) => {
        if (!window.confirm('Удалить камеру?')) return;

        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/webCameras/${cameraId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${await response.text()}`);
            }

            alert('Камера успешно удалена!');
            await loadCameras();
        } catch (err) {
            console.error('Ошибка удаления камеры:', err);
            alert('Ошибка: ' + err.message);
        }
    };

    const handleDownloadDocument = async (documentId, fileName) => {
        try {
            setDownloadingDocs(prev => ({ ...prev, [documentId]: true }));

            const { API_BASE_URL } = getConfig();

            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/documents/${documentId}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Ошибка загрузки файла: ${response.status}`);
            }

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = fileName || `document_${documentId}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error('Ошибка скачивания документа:', err);
            alert('Ошибка при скачивании файла: ' + err.message);
        } finally {
            setDownloadingDocs(prev => ({ ...prev, [documentId]: false }));
        }
    };

    // Функция для получения только последних версий документов
    const getLatestDocumentVersions = (documents) => {
        if (!documents || documents.length === 0) return [];

        // Сначала сортируем по дате создания (самые новые вперед)
        const sortedDocs = [...documents].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        const latestVersions = {};

        // Берем первый встретившийся документ для каждой комбинации тип+название
        sortedDocs.forEach(doc => {
            const docKey = `${doc.type}_${doc.title || 'untitled'}`;
            if (!latestVersions[docKey]) {
                latestVersions[docKey] = doc;
            }
        });

        return Object.values(latestVersions);
    };

    // Функция для изменения адреса
    const handleUpdateAddress = async () => {
        if (!editAddress.address.trim()) {
            alert('Введите адрес');
            return;
        }

        if (!window.confirm('Изменить адрес строительства?')) return;

        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/address`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    address: editAddress.address
                })
            });

            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${await response.text()}`);
            }

            alert('Адрес успешно изменен!');
            setOrder(prev => ({
                ...prev,
                address: editAddress.address
            }));
            setEditAddress({ address: '', isEditing: false });
        } catch (err) {
            console.error('Ошибка изменения адреса:', err);
            alert('Ошибка: ' + err.message);
        }
    };

    // Обработчики форм
    const handleAddStatus = async (e) => {
        e.preventDefault();
        if (!window.confirm('Изменить статус заказа?')) return;

        try {
            const { API_BASE_URL } = getConfig();
            console.log(newStatus);
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newStatus)
            });

            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${await response.text()}`);
            }

            alert('Статус успешно изменен!');
            setNewStatus({ statusType: '', comment: '' });
            // Загружаем обновленные данные
            await loadOrderData();
        } catch (err) {
            console.error('Ошибка изменения статуса:', err);
            alert('Ошибка: ' + err.message);
        }
    };

    const handleAddDocument = async (e) => {
        e.preventDefault();
        if (!window.confirm('Добавить новый документ?')) return;

        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/documents`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newDocument)
            });

            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${await response.text()}`);
            }

            alert('Документ успешно добавлен!');
            setNewDocument({
                type: 'contract',
                title: '',
                description: '',
                fileContent: null,
                fileName: ''
            });
            await loadOrderDocuments();
        } catch (err) {
            console.error('Ошибка добавления документа:', err);
            alert('Ошибка: ' + err.message);
        }
    };

    const handleAddStage = async (e) => {
        e.preventDefault();
        if (!window.confirm('Добавить новый этап строительства?')) return;

        try {
            const { API_BASE_URL } = getConfig();
            
            // Форматируем дату в ISO строку
            const formattedDate = newStage.plannedEndDate
                ? new Date(newStage.plannedEndDate).toISOString()
                : null;

            const requestBody = {
                ...newStage,
                plannedEndDate: formattedDate,
                progress: Number(newStage.progress)
            };

            console.log('Отправляемые данные:', JSON.stringify(requestBody, null, 2));

            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/stages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error(`Ошибка ${response.status}: ${errorText}`);
            }

            alert('Этап успешно добавлен!');
            setNewStage({
                stageType: 'foundation',
                description: '',
                plannedEndDate: '',
                progress: 0
            });
            await loadOrderStages();
        } catch (err) {
            console.error('Ошибка добавления этапа:', err);
            alert('Ошибка: ' + err.message);
        }
    };

    const handleUpdateStage = async (stageId) => {
        if (!window.confirm('Обновить этап строительства?')) return;

        const stageUpdateData = getStageUpdateData(stageId);

        try {
            const { API_BASE_URL } = getConfig();

            // Автоматически устанавливаем прогресс в зависимости от статуса
            const progressToSend = stageUpdateData.status === 'completed'
                ? 100
                : stageUpdateData.status === 'not_started'
                    ? 0
                    : stageUpdateData.progress;

            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/stages/${stageId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: stageUpdateData.status,
                    progress: progressToSend,
                    comment: stageUpdateData.comment,
                    actualEndDate: stageUpdateData.actualEndDate || null
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ошибка ${response.status}: ${errorText}`);
            }

            alert('Этап успешно обновлен!');
            resetStageUpdateData(stageId);
            await loadOrderStages();
        } catch (err) {
            console.error('Ошибка обновления этапа:', err);
            alert('Ошибка: ' + err.message);
        }
    };

    const handleDeleteStage = async (stageId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот этап?')) return;

        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/stages/${stageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                resetStageUpdateData(stageId);
                await loadOrderStages();
            } else {
                throw new Error(`Ошибка ${response.status}: ${await response.text()}`);
            }

            alert('Этап успешно удален!');
        } catch (err) {
            console.error('Ошибка удаления этапа:', err);
            alert('Ошибка: ' + err.message);
        }
    };

    // Вспомогательные функции
    const getStatusColor = (status) => {
        if (!status) return '#9E9E9E';

        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case 'new': return '#2196F3';
            case 'documentation': return '#FF9800';
            case 'construction': return '#4CAF50';
            case 'completion': return '#9C27B0';
            case 'closed': return '#607D8B';
            default: return '#9E9E9E';
        }
    };

    // Функция для получения состояния обновления конкретного этапа
    const getStageUpdateData = (stageId) => {
        return updateStages[stageId] || {
            status: 'in_progress',
            progress: 0,
            comment: '',
            actualEndDate: ''
        };
    };

// Функция для обновления состояния конкретного этапа
    const setStageUpdateData = (stageId, data) => {
        setUpdateStages(prev => ({
            ...prev,
            [stageId]: data
        }));
    };

// Функция для сброса состояния конкретного этапа
    const resetStageUpdateData = (stageId) => {
        setUpdateStages(prev => {
            const newState = { ...prev };
            delete newState[stageId];
            return newState;
        });
    };

    const getStatusText = (status) => {
        if (!status) return 'Неизвестно';

        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case 'new': return 'Новый';
            case 'documentation': return 'Документирование';
            case 'construction': return 'Строительство';
            case 'completion': return 'Завершение';
            case 'closed': return 'Закрыт';
            default: return status;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;

            return date.toLocaleDateString('ru-RU', {
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

    const formatChatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';

            const now = new Date();
            const isToday = date.getDate() === now.getDate() &&
                           date.getMonth() === now.getMonth() &&
                           date.getFullYear() === now.getFullYear();

            if (isToday) {
                return date.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                return date.toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        } catch {
            return '';
        }
    };

    const getStageStatusColor = (status) => {
        if (!status) return '#9E9E9E';

        switch (status) {
            case 'not_started': return '#9E9E9E';
            case 'in_progress': return '#FF9800';
            case 'completed': return '#4CAF50';
            default: return '#9E9E9E';
        }
    };

    const getStageStatusText = (status) => {
        if (!status) return 'Неизвестно';

        switch (status) {
            case 'not_started': return 'Не начат';
            case 'in_progress': return 'В работе';
            case 'completed': return 'Завершен';
            default: return status;
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const base64String = event.target.result.split(',')[1];
                    setNewDocument({
                        ...newDocument,
                        fileName: file.name,
                        fileContent: base64String
                    });
                } catch (err) {
                    console.error('Ошибка чтения файла:', err);
                    alert('Ошибка при загрузке файла');
                }
            };
            reader.onerror = () => {
                alert('Ошибка чтения файла');
            };
            reader.readAsDataURL(file);
        }
    };

    // Определяем, какие вкладки показывать
    const renderTabs = () => {
        const currentStatus = order?.currentStatus?.statusType?.toLowerCase() || 'new';
        const tabs = [];

        // Всегда показываем вкладку информации
        tabs.push({
            id: 'info',
            label: '📋 Информация',
            color: '#2196F3'
        });

        // Вкладка чата всегда доступна
        tabs.push({
            id: 'chat',
            label: '💬 Чат',
            color: '#00BCD4'
        });

        // Вкладка статусов для изменения статуса
        if (currentStatus !== 'closed') {
            tabs.push({
                id: 'status-change',
                label: '📊 Изменить статус',
                color: '#FF9800'
            });
        }

        // Вкладки в зависимости от текущего статуса
        if (currentStatus === 'documentation') {
            tabs.push({
                id: 'documents',
                label: '📄 Документы',
                color: '#4CAF50'
            });
        }

        if (currentStatus === 'construction') {
            tabs.push({
                id: 'construction',
                label: '🏗️ Строительство',
                color: '#9C27B0'
            });
            // Добавляем вкладку для камер только в статусе "construction"
            tabs.push({
                id: 'cameras',
                label: '📹 Видеонаблюдение',
                color: '#FF5722'
            });
        }

        if (currentStatus === 'completion') {
            tabs.push({
                id: 'completion-info',
                label: '✅ Завершение',
                color: '#607D8B'
            });
        }

        if (currentStatus === 'closed') {
            tabs.push({
                id: 'closed',
                label: '🔒 Завершен',
                color: '#607D8B'
            });
        }

        return tabs;
    };

    // Рендер контента в зависимости от вкладки
    const renderTabContent = () => {
        switch (activeTab) {
            case 'info':
                return renderInfoTab();
            case 'chat':
                return renderChatTab();
            case 'status-change':
                return renderStatusChangeTab();
            case 'documents':
                return renderDocumentsTab();
            case 'construction':
                return renderConstructionTab();
            case 'cameras':
                return renderCamerasTab();
            case 'completion-info':
                return renderCompletionTab();
            case 'closed':
                return renderClosedTab();
            default:
                return renderInfoTab();
        }
    };

    // Компоненты для каждой вкладки
    const renderInfoTab = () => {
        if (!order) return null;

        return (
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
                <h2 style={{ color: '#1a237e', marginBottom: '1.5rem' }}>📋 Информация о заказе</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    <div>
                        <h3 style={{ color: '#546e7a', marginBottom: '1rem' }}>Клиент</h3>
                        <div style={{
                            background: '#f8f9fa',
                            padding: '1.5rem',
                            borderRadius: '8px'
                        }}>
                            <p><strong>ID:</strong> {order.clientInfo?.id || '-'}</p>
                            <p><strong>ФИО:</strong> {order.clientInfo?.fullName || '-'}</p>
                            <p><strong>Email:</strong> {order.clientInfo?.email || '-'}</p>
                            <p><strong>Контакт:</strong> {order.clientInfo?.contact || '-'}</p>
                        </div>
                    </div>

                    <div>
                        <h3 style={{ color: '#546e7a', marginBottom: '1rem' }}>Проект</h3>
                        <div style={{
                            background: '#f8f9fa',
                            padding: '1.5rem',
                            borderRadius: '8px'
                        }}>
                            <p><strong>ID:</strong> {order.projectInfo?.id || '-'}</p>
                            <p><strong>Название:</strong> {order.projectInfo?.title || '-'}</p>
                            <p><strong>Базовая цена:</strong> {order.projectInfo?.basePrice || '-'}</p>
                            <p><strong>Общая площадь:</strong> {order.projectInfo?.totalArea || '-'} м²</p>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: '#546e7a', margin: 0 }}>Дополнительная информация</h3>
                        <button
                            onClick={() => setEditAddress({
                                isEditing: true,
                                address: order.address || ''
                            })}
                            style={{
                                padding: '8px 16px',
                                background: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            Изменить адрес
                        </button>
                    </div>

                    <div style={{
                        background: '#f8f9fa',
                        padding: '1.5rem',
                        borderRadius: '8px'
                    }}>
                        {editAddress.isEditing ? (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                    Адрес строительства
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={editAddress.address}
                                        onChange={(e) => setEditAddress({ ...editAddress, address: e.target.value })}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px'
                                        }}
                                        placeholder="Введите новый адрес..."
                                    />
                                    <button
                                        onClick={handleUpdateAddress}
                                        style={{
                                            padding: '10px 20px',
                                            background: '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Сохранить
                                    </button>
                                    <button
                                        onClick={() => setEditAddress({ isEditing: false, address: '' })}
                                        style={{
                                            padding: '10px 20px',
                                            background: '#f5f5f5',
                                            color: '#333',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p><strong>Адрес строительства:</strong> {order.address || '-'}</p>
                        )}

                        <p><strong>Дата создания заказа:</strong> {formatDate(order.createdAt)}</p>
                        <p><strong>Текущий статус:</strong>
                            <span style={{
                                padding: '4px 12px',
                                background: getStatusColor(order.currentStatus?.statusType),
                                color: 'white',
                                borderRadius: '20px',
                                marginLeft: '8px',
                                fontSize: '0.9rem'
                            }}>
                                {getStatusText(order.currentStatus?.statusType)}
                            </span>
                        </p>

                        {order.currentStage && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #dee2e6' }}>
                                <h4>Текущий этап</h4>
                                <p><strong>Этап:</strong> {order.currentStage.stageName || '-'}</p>
                                <p><strong>Описание:</strong> {order.currentStage.description || '-'}</p>
                                <p><strong>Прогресс:</strong> {order.currentStage.progress || 0}%</p>
                                <p><strong>Статус:</strong>
                                    <span style={{
                                        padding: '4px 8px',
                                        background: getStageStatusColor(order.currentStage.status),
                                        color: 'white',
                                        borderRadius: '4px',
                                        marginLeft: '8px'
                                    }}>
                                        {getStageStatusText(order.currentStage.status)}
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderChatTab = () => {
        const isUserMessage = (messageUserId) => {
            return messageUserId === userInfo?.id;
        };

        return (
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                height: '600px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <h2 style={{ color: '#1a237e', margin: 0 }}>💬 Чат заказа</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: isPolling ? '#4CAF50' : '#FF5722',
                            animation: isPolling ? 'pulse 2s infinite' : 'none'
                        }}></div>
                        <span style={{
                            fontSize: '0.85rem',
                            color: '#666',
                            padding: '4px 8px',
                            background: '#f5f5f5',
                            borderRadius: '4px'
                        }}>
                            {isPolling ? '🔄 Обновляется...' : '⏸️ Приостановлено'}
                        </span>
                        <button
                            onClick={forceCheckMessages}
                            style={{
                                padding: '6px 12px',
                                background: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            Обновить
                        </button>
                    </div>
                </div>
                
                <div style={{
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Заголовок чата */}
                    <div style={{
                        padding: '1rem',
                        background: '#f5f5f5',
                        borderRadius: '8px',
                        marginBottom: '1rem'
                    }}>
                        <p style={{ margin: 0, color: '#666' }}>
                            Обсуждение заказа #{orderId} с клиентом и сотрудниками
                            <br />
                            <small style={{ color: '#999' }}>
                                Автоматическое обновление каждые 5 секунд
                            </small>
                        </p>
                    </div>

                    {/* Сообщения */}
                    <div
                        ref={chatContainerRef}
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '1rem',
                            background: '#f8f9fa',
                            borderRadius: '8px',
                            marginBottom: '1rem'
                        }}
                    >
                        {chatMessages.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '3rem',
                                color: '#999'
                            }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                                <p>Нет сообщений. Будьте первым!</p>
                                <button
                                    onClick={forceCheckMessages}
                                    style={{
                                        marginTop: '1rem',
                                        padding: '8px 16px',
                                        background: '#f5f5f5',
                                        color: '#333',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Проверить сообщения
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {chatMessages.map((message) => {
                                    const isOwnMessage = isUserMessage(message.userId);
                                    return (
                                        <div
                                            key={message.id || Math.random()}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
                                            }}
                                        >
                                            <div style={{
                                                maxWidth: '80%',
                                                background: isOwnMessage ? '#e3f2fd' : '#fff',
                                                borderRadius: '12px',
                                                padding: '0.75rem 1rem',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                border: `1px solid ${isOwnMessage ? '#bbdefb' : '#e0e0e0'}`
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    marginBottom: '0.25rem'
                                                }}>
                                                    <div style={{
                                                        fontWeight: 'bold',
                                                        color: isOwnMessage ? '#1565c0' : '#333'
                                                    }}>
                                                        {message.userName}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        color: '#999',
                                                        marginLeft: '1rem'
                                                    }}>
                                                        {formatChatDate(message.createdAt)}
                                                    </div>
                                                </div>
                                                {message.userRole && (
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        color: '#666',
                                                        marginBottom: '0.5rem'
                                                    }}>
                                                        {message.userRole}
                                                    </div>
                                                )}
                                                <div style={{
                                                    color: '#333',
                                                    lineHeight: '1.4'
                                                }}>
                                                    {message.message}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Форма отправки сообщения */}
                    <form onSubmit={handleSendMessage} style={{ marginTop: 'auto' }}>
                        <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'flex-end'
                        }}>
                            <div style={{ flex: 1 }}>
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        minHeight: '60px',
                                        resize: 'none',
                                        fontFamily: 'inherit',
                                        fontSize: '1rem'
                                    }}
                                    placeholder="Введите сообщение..."
                                    rows={3}
                                />
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: '#999',
                                    marginTop: '0.25rem'
                                }}>
                                    Нажмите Enter для отправки, Shift+Enter для новой строки
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: !newMessage.trim() ? '#ccc' : 'linear-gradient(135deg, #00BCD4, #0097A7)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: !newMessage.trim() ? 'not-allowed' : 'pointer',
                                    fontWeight: 600,
                                    height: 'fit-content'
                                }}
                            >
                                Отправить
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const renderStatusChangeTab = () => (
        <div>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                marginBottom: '2rem'
            }}>
                <h2 style={{ color: '#1a237e', marginBottom: '1.5rem' }}>Изменить статус заказа</h2>

                <div style={{
                    background: '#e8f5e9',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    border: '1px solid #c8e6c9'
                }}>
                    <p style={{ margin: 0, color: '#2e7d32' }}>
                        <strong>Текущий статус:</strong> {getStatusText(order?.currentStatus?.statusType)}
                    </p>
                </div>

                <form onSubmit={handleAddStatus}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Выберите новый статус
                        </label>
                        <select
                            value={newStatus.statusType}
                            onChange={(e) => setNewStatus({ ...newStatus, statusType: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '1rem'
                            }}
                            required
                        >
                            <option value="">-- Выберите статус --</option>
                            {availableStatuses.map(status => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Комментарий к изменению статуса
                        </label>
                        <textarea
                            value={newStatus.comment}
                            onChange={(e) => setNewStatus({ ...newStatus, comment: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '1rem',
                                minHeight: '100px'
                            }}
                            placeholder="Опишите причину изменения статуса..."
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #FF9800, #F57C00)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '1rem'
                        }}
                    >
                        Изменить статус
                    </button>
                </form>
            </div>

            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
                <h2 style={{ color: '#1a237e', marginBottom: '1.5rem' }}>История статусов</h2>

                {statuses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                        Нет истории статусов
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {statuses.map((status) => (
                            <div key={status.id || Math.random()} style={{
                                padding: '1.5rem',
                                borderLeft: `4px solid ${getStatusColor(status.statusType)}`,
                                background: '#f8f9fa',
                                borderRadius: '0 8px 8px 0'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: '#1a237e' }}>
                                            {getStatusText(status.statusType)}
                                        </h3>
                                        <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                                            {status.comment || 'Без комментария'}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                                            {formatDate(status.createdAt)}
                                        </div>
                                        {status.changedBy && (
                                            <div style={{ color: '#999', fontSize: '0.85rem', marginTop: '5px' }}>
                                                Изменил: {status.changedBy.fullName || 'Неизвестно'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderDocumentsTab = () => (
        <div>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                marginBottom: '2rem'
            }}>
                <h2 style={{ color: '#1a237e', marginBottom: '1.5rem' }}>➕ Добавить документ</h2>

                <form onSubmit={handleAddDocument}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Тип документа
                            </label>
                            <select
                                value={newDocument.type}
                                onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px'
                                }}
                            >
                                <option value="contract">Договор</option>
                                <option value="specification">Спецификация</option>
                                <option value="permit">Разрешение</option>
                                <option value="report">Отчет</option>
                                <option value="act">Акт</option>
                                <option value="invoice">Счет</option>
                                <option value="other">Другое</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Название документа
                            </label>
                            <input
                                type="text"
                                value={newDocument.title}
                                onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px'
                                }}
                                placeholder="Введите название документа"
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Описание документа
                        </label>
                        <textarea
                            value={newDocument.description}
                            onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                minHeight: '80px'
                            }}
                            placeholder="Введите описание документа..."
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Загрузить файл
                        </label>
                        <input
                            type="file"
                            onChange={handleFileUpload}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                background: 'white'
                            }}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        />
                        {newDocument.fileName && (
                            <div style={{ marginTop: '5px', color: '#4CAF50', fontSize: '0.9rem' }}>
                                Выбран файл: {newDocument.fileName}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Добавить документ
                    </button>
                </form>
            </div>

            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
                <h2 style={{ color: '#1a237e', marginBottom: '1.5rem' }}>📑 Список документов</h2>

                {documents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                        Нет документов
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f5f5f5' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Тип</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Название</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Статус</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Дата создания</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map(doc => (
                                    <tr key={doc.id || Math.random()} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                background: '#e3f2fd',
                                                color: '#1976d2',
                                                borderRadius: '4px',
                                                fontSize: '0.85rem'
                                            }}>
                                                {doc.type || 'Не указан'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <strong>{doc.title || 'Без названия'}</strong>
                                            {doc.description && (
                                                <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
                                                    {doc.description}
                                                </div>
                                            )}
                                            {doc.fileName && (
                                                <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '5px' }}>
                                                    📎 {doc.fileName}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                background: doc.status === 'signed' ? '#4CAF50' :
                                                    doc.status === 'rejected' ? '#F44336' : '#FF9800',
                                                color: 'white',
                                                borderRadius: '4px',
                                                fontSize: '0.85rem'
                                            }}>
                                                {doc.status === 'signed' ? 'Подтвержден' :
                                                    doc.status === 'rejected' ? 'Отклонен' : 'На рассмотрении'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{formatDate(doc.createdAt)}</td>
                                        <td style={{ padding: '1rem' }}>
                                            {doc.content && (
                                                <button
                                                    onClick={() => handleDownloadDocument(doc.id, doc.fileName)}
                                                    disabled={downloadingDocs[doc.id]}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: downloadingDocs[doc.id] ? '#ccc' : '#2196F3',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: downloadingDocs[doc.id] ? 'not-allowed' : 'pointer',
                                                        fontSize: '0.9rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    {downloadingDocs[doc.id] ? (
                                                        <>
                                                            <div style={{
                                                                width: '12px',
                                                                height: '12px',
                                                                border: '2px solid #fff',
                                                                borderTopColor: 'transparent',
                                                                borderRadius: '50%',
                                                                animation: 'spin 1s linear infinite'
                                                            }}></div>
                                                            Загрузка...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Скачать
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    const renderConstructionTab = () => (
        <div>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                marginBottom: '2rem'
            }}>
                <h2 style={{ color: '#1a237e', marginBottom: '1.5rem' }}>➕ Добавить этап строительства</h2>

                <form onSubmit={handleAddStage}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Тип этапа
                            </label>
                            <select
                                value={newStage.stageType}
                                onChange={(e) => setNewStage({ ...newStage, stageType: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px'
                                }}
                            >
                                <option value="SITE_PREPARATION">Подготовка участка</option>
                                <option value="EXCAVATION">Земляные работы</option>
                                <option value="FOUNDATION">Заливка фундамента</option>
                                <option value="WALLS">Возведение стен</option>
                                <option value="FLOOR_SLABS">Устройство межэтажных перекрытий</option>
                                <option value="ROOF">Монтаж кровли</option>
                                <option value="WINDOWS_DOORS">Установка окон и дверей</option>
                                <option value="EXTERIOR_WALLS">Наружная отделка фасада</option>
                                <option value="EXTERIOR_INSULATION">Утепление наружных стен</option>
                                <option value="ELECTRICAL">Электромонтажные работы</option>
                                <option value="PLUMBING">Сантехнические работы</option>
                                <option value="HEATING_VENTILATION">Монтаж отопления и вентиляции</option>
                                <option value="WALL_PREPARATION">Выравнивание стен и потолков</option>
                                <option value="FLOOR_COVERING">Укладка напольных покрытий</option>
                                <option value="PAINTING_DECORATING">Покраска и декорирование</option>
                                <option value="FINISHING">Финишная отделка</option>
                                <option value="LANDSCAPING">Благоустройство территории</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Плановая дата завершения
                            </label>
                            <input
                                type="datetime-local"
                                value={newStage.plannedEndDate}
                                onChange={(e) => setNewStage({ ...newStage, plannedEndDate: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Описание работ <span style={{ color: '#999', fontSize: '0.9rem', fontWeight: 'normal' }}>(необязательно)</span>
                        </label>
                        <textarea
                            value={newStage.description}
                            onChange={(e) => setNewStage({ ...newStage, description: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                minHeight: '100px'
                            }}
                            placeholder="Опишите работы по этапу..."
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Начальный прогресс (%)
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={newStage.progress}
                                onChange={(e) => setNewStage({ ...newStage, progress: parseInt(e.target.value) })}
                                style={{ flex: 1 }}
                            />
                            <span style={{ minWidth: '50px', textAlign: 'center', fontWeight: 'bold' }}>
                            {newStage.progress}%
                        </span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #9C27B0, #7B1FA2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Добавить этап
                    </button>
                </form>
            </div>

            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
                <h2 style={{ color: '#1a237e', marginBottom: '1.5rem' }}>📋 Этапы строительства</h2>

                {stages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                        Нет этапов строительства
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {stages.map(stage => {
                            // Определяем stageUpdateData внутри map
                            const stageUpdateData = getStageUpdateData(stage.id);

                            return (
                                <div key={stage.id || Math.random()} style={{
                                    padding: '1.5rem',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    background: '#f8f9fa'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ margin: 0, color: '#1a237e' }}>
                                                {stage.stageName || stage.stageType || 'Без названия'}
                                            </h3>
                                            <p style={{ margin: '5px 0', color: '#666' }}>
                                                {stage.description || 'Без описания'}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '10px' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                background: getStageStatusColor(stage.status),
                                                color: 'white',
                                                borderRadius: '4px',
                                                fontSize: '0.85rem'
                                            }}>
                                                {getStageStatusText(stage.status)}
                                            </span>
                                                <span style={{ color: '#666' }}>
                                                Прогресс: <strong>{stage.progress || 0}%</strong>
                                            </span>
                                                <div style={{
                                                    width: '100px',
                                                    height: '8px',
                                                    background: '#e0e0e0',
                                                    borderRadius: '4px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${stage.progress || 0}%`,
                                                        height: '100%',
                                                        background: getStageStatusColor(stage.status),
                                                        transition: 'width 0.3s'
                                                    }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: '#666', fontSize: '0.9rem' }}>
                                                Начало: {formatDate(stage.startDate)}
                                            </div>
                                            {stage.plannedEndDate && (
                                                <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '5px' }}>
                                                    План завершения: {formatDate(stage.plannedEndDate)}
                                                </div>
                                            )}
                                            {stage.actualEndDate && (
                                                <div style={{ color: '#4CAF50', fontSize: '0.9rem', marginTop: '5px' }}>
                                                    Факт. завершения: {formatDate(stage.actualEndDate)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #dee2e6' }}>
                                        <h4 style={{ marginBottom: '0.5rem' }}>Обновить этап</h4>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Статус</div>
                                                <select
                                                    value={stageUpdateData.status}
                                                    onChange={(e) => {
                                                        const newStatus = e.target.value;
                                                        let newProgress = stageUpdateData.progress;
                                                        let newActualEndDate = stageUpdateData.actualEndDate;

                                                        // Автоматически обновляем прогресс при изменении статуса
                                                        if (newStatus === 'completed') {
                                                            newProgress = 100;
                                                            // Автоматически устанавливаем дату завершения
                                                            if (!newActualEndDate) {
                                                                const now = new Date();
                                                                // Форматируем дату для input типа datetime-local
                                                                const year = now.getFullYear();
                                                                const month = String(now.getMonth() + 1).padStart(2, '0');
                                                                const day = String(now.getDate()).padStart(2, '0');
                                                                const hours = String(now.getHours()).padStart(2, '0');
                                                                const minutes = String(now.getMinutes()).padStart(2, '0');
                                                                newActualEndDate = `${year}-${month}-${day}T${hours}:${minutes}`;
                                                            }
                                                        } else if (newStatus === 'not_started') {
                                                            newProgress = 0;
                                                            newActualEndDate = '';
                                                        } else if (newStatus === 'in_progress' && stageUpdateData.progress === 0) {
                                                            newProgress = 10;
                                                        }

                                                        setStageUpdateData(stage.id, {
                                                            ...stageUpdateData,
                                                            status: newStatus,
                                                            progress: newProgress,
                                                            actualEndDate: newActualEndDate
                                                        });
                                                    }}
                                                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }}
                                                >
                                                    <option value="not_started">Не начат</option>
                                                    <option value="in_progress">В работе</option>
                                                    <option value="completed">Завершен</option>
                                                </select>
                                            </div>

                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Прогресс (%)</div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={stageUpdateData.progress}
                                                    onChange={(e) => setStageUpdateData(stage.id, {
                                                        ...stageUpdateData,
                                                        progress: parseInt(e.target.value)
                                                    })}
                                                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }}
                                                />
                                            </div>

                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Комментарий</div>
                                                <input
                                                    type="text"
                                                    value={stageUpdateData.comment}
                                                    onChange={(e) => setStageUpdateData(stage.id, {
                                                        ...stageUpdateData,
                                                        comment: e.target.value
                                                    })}
                                                    placeholder="Комментарий"
                                                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleUpdateStage(stage.id)}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: '#2196F3',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                Обновить
                                            </button>

                                            <button
                                                onClick={() => handleDeleteStage(stage.id)}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: '#F44336',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );

    const renderCamerasTab = () => (
        <div>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                marginBottom: '2rem'
            }}>
                <h2 style={{ color: '#1a237e', marginBottom: '1.5rem' }}>➕ Добавить камеру видеонаблюдения</h2>

                <form onSubmit={handleAddCamera}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Название камеры
                            </label>
                            <input
                                type="text"
                                value={newCamera.name}
                                onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px'
                                }}
                                placeholder="Например: Главный вход"
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                IP-адрес
                            </label>
                            <input
                                type="text"
                                value={newCamera.ip}
                                onChange={(e) => setNewCamera({ ...newCamera, ip: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px'
                                }}
                                placeholder="Например: 192.168.1.100"
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Порт
                            </label>
                            <input
                                type="number"
                                value={newCamera.port}
                                onChange={(e) => setNewCamera({ ...newCamera, port: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px'
                                }}
                                placeholder="Например: 554"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #FF5722, #E64A19)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Добавить камеру
                    </button>
                </form>
            </div>

            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
                <h2 style={{ color: '#1a237e', marginBottom: '1.5rem' }}>📹 Список камер</h2>

                {cameras.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                        Нет добавленных камер
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {cameras.map(camera => (
                            <div key={camera.id || Math.random()} style={{
                                padding: '1.5rem',
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                background: '#f8f9fa'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: '#1a237e' }}>
                                            {camera.name || 'Камера без названия'}
                                        </h3>
                                        <div style={{ marginTop: '10px' }}>
                                            <p style={{ margin: '5px 0', color: '#666' }}>
                                                <strong>IP:</strong> {camera.ip || 'Не указан'}
                                            </p>
                                            <p style={{ margin: '5px 0', color: '#666' }}>
                                                <strong>Порт:</strong> {camera.port || 'Не указан'}
                                            </p>
                                            {camera.streamUrl && (
                                                <p style={{ margin: '5px 0', color: '#666' }}>
                                                    <strong>Stream URL:</strong> 
                                                    <a 
                                                        href={camera.streamUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        style={{ 
                                                            marginLeft: '8px',
                                                            color: '#2196F3',
                                                            textDecoration: 'none'
                                                        }}
                                                    >
                                                        {camera.streamUrl}
                                                    </a>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{ textAlign: 'right', color: '#666', fontSize: '0.9rem' }}>
                                            ID: {camera.id}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => setEditCamera({
                                                    id: camera.id,
                                                    name: camera.name,
                                                    ip: camera.ip,
                                                    port: camera.port
                                                })}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#FF9800',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                Изменить
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCamera(camera.id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#F44336',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {editCamera.id === camera.id && (
                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #dee2e6' }}>
                                        <h4 style={{ marginBottom: '1rem' }}>Редактировать камеру</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Название</label>
                                                <input
                                                    type="text"
                                                    value={editCamera.name}
                                                    onChange={(e) => setEditCamera({ ...editCamera, name: e.target.value })}
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>IP-адрес</label>
                                                <input
                                                    type="text"
                                                    value={editCamera.ip}
                                                    onChange={(e) => setEditCamera({ ...editCamera, ip: e.target.value })}
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Порт</label>
                                                <input
                                                    type="number"
                                                    value={editCamera.port}
                                                    onChange={(e) => setEditCamera({ ...editCamera, port: e.target.value })}
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleUpdateCamera(camera.id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        background: '#4CAF50',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        height: '42px'
                                                    }}
                                                >
                                                    Сохранить
                                                </button>
                                                <button
                                                    onClick={() => setEditCamera({ id: null, name: '', ip: '', port: '' })}
                                                    style={{
                                                        padding: '8px 16px',
                                                        background: '#f5f5f5',
                                                        color: '#333',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        height: '42px'
                                                    }}
                                                >
                                                    Отмена
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {camera.streamUrl && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <h4 style={{ marginBottom: '0.5rem' }}>📹 Видеотрансляция</h4>
                                        <div style={{
                                            width: '100%',
                                            height: '400px',
                                            background: '#000',
                                            borderRadius: '6px',
                                            overflow: 'hidden'
                                        }}>
                                            <iframe
                                                src={camera.streamUrl}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    border: 'none'
                                                }}
                                                title={`Камера ${camera.name}`}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: '#666',
                                            marginTop: '0.5rem',
                                            textAlign: 'center'
                                        }}>
                                            🔴 Трансляция в реальном времени
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderCompletionTab = () => {
        if (!order) return null;

        return (
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
                <h2 style={{ color: '#1a237e', marginBottom: '1.5rem' }}>✅ Информация о завершении</h2>

                <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                        background: '#f3e5f5',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '1px solid #ce93d8',
                        marginBottom: '1.5rem'
                    }}>
                        <h3 style={{ color: '#7b1fa2', margin: '0 0 1rem 0' }}>Готовность к завершению</h3>
                        <p style={{ color: '#666', margin: 0 }}>
                            Проверьте, что все этапы строительства завершены и документы подписаны.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    <div>
                        <h3 style={{ color: '#546e7a', marginBottom: '1rem' }}>Сводная информация</h3>
                        <div style={{
                            background: '#f8f9fa',
                            padding: '1.5rem',
                            borderRadius: '8px'
                        }}>
                            <p><strong>Проект:</strong> {order.projectInfo?.title || '-'}</p>
                            <p><strong>Клиент:</strong> {order.clientInfo?.fullName || '-'}</p>
                            <p><strong>Адрес:</strong> {order.address || '-'}</p>
                            <p><strong>Дата начала:</strong> {formatDate(order.createdAt)}</p>
                            <p><strong>Текущий статус:</strong>
                                <span style={{
                                    padding: '4px 8px',
                                    background: getStatusColor(order.currentStatus?.statusType),
                                    color: 'white',
                                    borderRadius: '4px',
                                    marginLeft: '8px'
                                }}>
                                    {getStatusText(order.currentStatus?.statusType)}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div>
                        <h3 style={{ color: '#546e7a', marginBottom: '1rem' }}>Статистика по этапам</h3>
                        <div style={{
                            background: '#f8f9fa',
                            padding: '1.5rem',
                            borderRadius: '8px'
                        }}>
                            <p><strong>Всего этапов:</strong> {stages.length}</p>
                            <p><strong>Завершено этапов:</strong> {stages.filter(s => s.status === 'completed').length}</p>
                            <p><strong>В работе этапов:</strong> {stages.filter(s => s.status === 'in_progress').length}</p>
                            <p><strong>Не начато этапов:</strong> {stages.filter(s => s.status === 'not_started').length}</p>
                            <p><strong>Общий прогресс:</strong>
                                {stages.length > 0
                                    ? ` ${Math.round(stages.reduce((sum, stage) => sum + (stage.progress || 0), 0) / stages.length)}%`
                                    : ' 0%'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ color: '#546e7a', marginBottom: '1rem' }}>Документы для завершения</h3>
                    <div style={{
                        background: '#f8f9fa',
                        padding: '1.5rem',
                        borderRadius: '8px'
                    }}>
                        <p>Для завершения заказа убедитесь, что все необходимые документы подготовлены:</p>
                        <ul style={{ margin: '1rem 0', paddingLeft: '1.5rem' }}>
                            <li>Акт приема-передачи работ</li>
                            <li>Гарантийные документы</li>
                            <li>Исполнительная документация</li>
                            <li>Акт выполненных работ</li>
                        </ul>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button
                                onClick={() => setActiveTab('documents')}
                                style={{
                                    padding: '10px 20px',
                                    background: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                📄 Перейти к документам
                            </button>
                            <button
                                onClick={() => setActiveTab('construction')}
                                style={{
                                    padding: '10px 20px',
                                    background: '#2196F3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                🏗️ Перейти к этапам
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderClosedTab = () => {
        if (!order) return null;

        return (
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
                <h2 style={{ color: '#1a237e', marginBottom: '1rem' }}>Заказ успешно завершен!</h2>
                <p style={{ color: '#666', marginBottom: '2rem', fontSize: '1.1rem' }}>
                    Заказ #{orderId} успешно завершен и закрыт.
                </p>

                <div style={{
                    background: '#f8f9fa',
                    padding: '2rem',
                    borderRadius: '8px',
                    marginTop: '2rem',
                    textAlign: 'left'
                }}>
                    <h3 style={{ color: '#546e7a', marginBottom: '1rem', textAlign: 'center' }}>Итоговая информация по заказу</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <h4 style={{ color: '#666', marginBottom: '0.5rem' }}>Основная информация</h4>
                            <p><strong>Проект:</strong> {order.projectInfo?.title || '-'}</p>
                            <p><strong>Клиент:</strong> {order.clientInfo?.fullName || '-'}</p>
                            <p><strong>Адрес строительства:</strong> {order.address || '-'}</p>
                            <p><strong>Дата создания заказа:</strong> {formatDate(order.createdAt)}</p>
                        </div>
                        <div>
                            <h4 style={{ color: '#666', marginBottom: '0.5rem' }}>Итоговая статистика</h4>
                            <p><strong>Дата завершения:</strong> {formatDate(order.updatedAt)}</p>
                            <p><strong>Всего этапов выполнено:</strong> {stages.length}</p>
                            <p><strong>Всего документов:</strong> {documents.length}</p>
                            <p><strong>Статусов в истории:</strong> {statuses.length}</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #dee2e6' }}>
                        <h4 style={{ color: '#666', marginBottom: '0.5rem', textAlign: 'center' }}>Сводка по этапам</h4>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', color: '#4CAF50', fontWeight: 'bold' }}>
                                    {stages.filter(s => s.status === 'completed').length}
                                </div>
                                <div style={{ color: '#666', fontSize: '0.9rem' }}>Завершено</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', color: '#FF9800', fontWeight: 'bold' }}>
                                    {stages.filter(s => s.status === 'in_progress').length}
                                </div>
                                <div style={{ color: '#666', fontSize: '0.9rem' }}>В работе</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', color: '#9E9E9E', fontWeight: 'bold' }}>
                                    {stages.filter(s => s.status === 'not_started').length}
                                </div>
                                <div style={{ color: '#666', fontSize: '0.9rem' }}>Не начато</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#e8f5e9', borderRadius: '8px' }}>
                    <p style={{ margin: 0, color: '#2e7d32' }}>
                        ✅ Заказ закрыт. Все работы завершены и приняты клиентом.
                    </p>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid #e3f2fd',
                    borderTopColor: '#2196F3',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                }}></div>
                <p>Загрузка данных заказа...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{
                    color: '#c62828',
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: '#ffebee',
                    borderRadius: '8px'
                }}>
                    ⚠️ {error}
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                        onClick={loadOrderData}
                        style={{
                            padding: '10px 20px',
                            background: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Попробовать снова
                    </button>
                    <button
                        onClick={() => navigate('/admin')}
                        style={{
                            padding: '10px 20px',
                            background: '#f5f5f5',
                            color: '#333',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Назад к панели
                    </button>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{
                    color: '#c62828',
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: '#ffebee',
                    borderRadius: '8px'
                }}>
                    ⚠️ Заказ не найден
                </div>
                <button
                    onClick={() => navigate('/admin')}
                    style={{
                        padding: '10px 20px',
                        background: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    Назад к панели
                </button>
            </div>
        );
    }

    const tabs = renderTabs();

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
            {/* Заголовок */}
            <div style={{ marginBottom: '2rem' }}>
                <Link to="/admin" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: '#2196F3',
                    textDecoration: 'none',
                    marginBottom: '1rem'
                }}>
                    <span style={{ fontSize: '1.2rem', marginRight: '5px' }}>←</span> Назад к панели управления
                </Link>

                <h1 style={{ color: '#1a237e', marginBottom: '0.5rem' }}>
                    🏗️ Управление заказом #{orderId}
                </h1>

                {order && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        marginBottom: '1rem'
                    }}>
                        <span style={{
                            padding: '6px 16px',
                            background: getStatusColor(order.currentStatus?.statusType),
                            color: 'white',
                            borderRadius: '20px',
                            fontWeight: 600,
                            fontSize: '0.9rem'
                        }}>
                            {getStatusText(order.currentStatus?.statusType)}
                        </span>

                        <span>Клиент: <strong>{order.clientInfo?.fullName || 'Не указан'}</strong></span>
                        <span>Проект: <strong>{order.projectInfo?.title || 'Не указан'}</strong></span>
                        <span>Адрес: <strong>{order.address || 'Не указан'}</strong></span>
                    </div>
                )}
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
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '12px 20px',
                            border: 'none',
                            background: activeTab === tab.id ? tab.color : '#f5f5f5',
                            color: activeTab === tab.id ? 'white' : '#333',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Контент вкладок */}
            <div>
                {renderTabContent()}
            </div>

            <style>
                {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                `}
            </style>
        </div>
    );
}