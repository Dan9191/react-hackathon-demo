import React, { useState, useEffect } from 'react';
import { getConfig } from '../config';

export default function OrderDocuments({ token, orderId }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [signingId, setSigningId] = useState(null);
    const [signature, setSignature] = useState('');
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, [orderId, token]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(
                `${API_BASE_URL}/api/orders/${orderId}/documents`,
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

            // Добавила фильтрацию - оставляем только последнюю версию каждого документа
            const latestDocuments = getLatestDocumentVersions(data);

            setDocuments(latestDocuments);
        } catch (err) {
            console.error('Ошибка загрузки документов:', err);
            setError('Не удалось загрузить документы');
        } finally {
            setLoading(false);
        }
    };

    const getLatestDocumentVersions = (documents) => {
        if (!documents || documents.length === 0) return [];

        // Сортируем по дате создания (самые новые первые)
        const sortedByDate = [...documents].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA; // По убыванию (новые вперед)
        });

        // Берем первую (самую новую) версию каждого документа
        const latestVersions = {};

        sortedByDate.forEach(doc => {
            const docKey = doc.title || `doc_${doc.type}`;
            if (!latestVersions[docKey]) {
                latestVersions[docKey] = doc;
            }
        });

        return Object.values(latestVersions);
    };

    const handleSignDocument = async (documentId) => {
        if (!signature.trim()) {
            alert('Введите подпись');
            return;
        }

        setSigningId(documentId);
        try {
            const { API_BASE_URL } = getConfig();

            // добавила кодирование подписи в base64
            const base64Signature = btoa(encodeURIComponent(signature.trim()));

            const response = await fetch(
                `${API_BASE_URL}/api/orders/${orderId}/documents/${documentId}/sign`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ signature: base64Signature })
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            alert('Документ успешно подписан!');
            setSignature('');
            fetchDocuments(); // Обновляем список документов
        } catch (err) {
            console.error('Ошибка подписания документа:', err);
            alert('Не удалось подписать документ');
        } finally {
            setSigningId(null);
        }
    };

    const handleViewDocument = async (documentId) => {
        try {
            const { API_BASE_URL } = getConfig();
            const response = await fetch(
                `${API_BASE_URL}/api/orders/${orderId}/documents/${documentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const documentData = await response.json();
            setSelectedDoc(documentData);
            setShowModal(true);
        } catch (err) {
            console.error('Ошибка загрузки документа:', err);
            alert('Не удалось загрузить документ');
        }
    };

    const getDocumentStatusText = (status) => {
        const statusMap = {
            'new': 'Новый',
            'pending': 'Ожидает подписи',
            'signed': 'Подписан',
            'rejected': 'Отклонен',
            'expired': 'Просрочен'
        };
        return statusMap[status?.toLowerCase()] || status || 'Неизвестно';
    };

    const getDocumentStatusColor = (status) => {
        const statusLower = status?.toLowerCase();
        switch (statusLower) {
            case 'signed': return '#4CAF50';
            case 'pending': return '#FF9800';
            case 'rejected': return '#F44336';
            case 'expired': return '#757575';
            default: return '#9E9E9E';
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

    const downloadDocument = (document) => {
        if (document.content) {
            // Если есть контент в base64 или текст
            const blob = new Blob([document.content], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = document.fileName || `document_${document.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else if (document.fileName) {
            // Если есть ссылка на файл
            const { API_BASE_URL } = getConfig();
            const downloadUrl = `${API_BASE_URL}/api/orders/${orderId}/documents/${document.id}/download`;
            window.open(downloadUrl, '_blank');
        }
    };

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
                <p style={{ color: '#666', marginTop: '1rem' }}>Загрузка документов...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#F44336' }}>
                <p>{error}</p>
                <button
                    onClick={fetchDocuments}
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
        <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            padding: '2rem',
            marginTop: '1.5rem',
            background: 'white'
        }}>
            <h3 style={{ color: '#1a237e', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📄</span> Документы к заказу
            </h3>

            {/* Форма для подписи */}
            <div style={{
                background: '#f5f5f5',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem'
            }}>
                <h4 style={{ color: '#37474f', marginBottom: '0.5rem' }}>Подпись документов</h4>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Для подписания документов введите вашу подпись в формате "Имя Фамилия"
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        value={signature}
                        onChange={(e) => setSignature(e.target.value)}
                        placeholder="Введите вашу подпись"
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                    <button
                        onClick={() => setSignature(`${localStorage.getItem('userFirstName') || ''} ${localStorage.getItem('userLastName') || ''}`.trim())}
                        style={{
                            padding: '10px 16px',
                            background: '#e0e0e0',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Заполнить автоматически
                    </button>
                </div>
            </div>

            {/* Список документов */}
            {documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    <p>Нет документов для отображения</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {documents.map(doc => (
                        <div
                            key={doc.id}
                            style={{
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                padding: '1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        background: getDocumentStatusColor(doc.status),
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {getDocumentStatusText(doc.status)}
                                    </span>
                                    <span style={{ color: '#666', fontSize: '0.85rem' }}>
                                        {formatDate(doc.createdAt)}
                                    </span>
                                </div>
                                <h4 style={{ color: '#1a237e', margin: '0 0 0.25rem 0' }}>
                                    {doc.title || `Документ ${doc.type}`}
                                </h4>
                                <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                                    Тип: {doc.type} {doc.fileName ? `(${doc.fileName})` : ''}
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleViewDocument(doc.id)}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'transparent',
                                        border: '1px solid #2196F3',
                                        color: '#2196F3',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    Посмотреть
                                </button>

                                {doc.status?.toLowerCase() === 'pending' && (
                                    <button
                                        onClick={() => handleSignDocument(doc.id)}
                                        disabled={signingId === doc.id || !signature.trim()}
                                        style={{
                                            padding: '8px 16px',
                                            background: signingId === doc.id ? '#cccccc' : '#4CAF50',
                                            border: 'none',
                                            color: 'white',
                                            borderRadius: '4px',
                                            cursor: signingId === doc.id ? 'not-allowed' : 'pointer',
                                            fontSize: '0.9rem',
                                            minWidth: '100px'
                                        }}
                                    >
                                        {signingId === doc.id ? 'Подписание...' : 'Подписать'}
                                    </button>
                                )}

                                {doc.fileName && (
                                    <button
                                        onClick={() => downloadDocument(doc)}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'transparent',
                                            border: '1px solid #666',
                                            color: '#666',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        Скачать
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Модальное окно для просмотра документа */}
            {showModal && selectedDoc && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '900px',
                        maxHeight: '90vh',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            padding: '1.5rem',
                            borderBottom: '1px solid #e0e0e0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0, color: '#1a237e' }}>{selectedDoc.title}</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#666'
                                }}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div style={{
                            padding: '1.5rem',
                            overflow: 'auto',
                            flex: 1
                        }}>
                            {selectedDoc.content ? (
                                selectedDoc.fileName?.endsWith('.pdf') ? (
                                    <iframe
                                        src={`data:application/pdf;base64,${selectedDoc.content}`}
                                        title={selectedDoc.title}
                                        style={{ width: '100%', height: '500px', border: 'none' }}
                                    />
                                ) : (
                                    <pre style={{
                                        whiteSpace: 'pre-wrap',
                                        wordWrap: 'break-word',
                                        fontFamily: 'monospace',
                                        fontSize: '14px',
                                        margin: 0
                                    }}>
                                        {selectedDoc.content}
                                    </pre>
                                )
                            ) : (
                                <p style={{ color: '#666', textAlign: 'center' }}>
                                    Содержимое документа не доступно
                                </p>
                            )}
                        </div>
                        
                        <div style={{
                            padding: '1rem 1.5rem',
                            borderTop: '1px solid #e0e0e0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f9f9f9'
                        }}>
                            <div style={{ color: '#666', fontSize: '0.9rem' }}>
                                Статус: <span style={{
                                    color: getDocumentStatusColor(selectedDoc.status),
                                    fontWeight: 'bold'
                                }}>
                                    {getDocumentStatusText(selectedDoc.status)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => downloadDocument(selectedDoc)}
                                    style={{
                                        padding: '8px 16px',
                                        background: '#2196F3',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Скачать
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'transparent',
                                        border: '1px solid #666',
                                        color: '#666',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Закрыть
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx="true">{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}