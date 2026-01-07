import React, { useState } from 'react';
import { getConfig } from '../config';

export default function OrderModal({ token, templateId, templateTitle, onClose, onSuccess }) {
    const [form, setForm] = useState({
        contact: ''
    });
    const [contactType, setContactType] = useState('telegram'); // По умолчанию Telegram
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.contact.trim()) {
            setError('Пожалуйста, укажите контактные данные');
            return;
        }

        setLoading(true);
        setError('');

        const { API_BASE_URL } = getConfig();
        const applicationData = {
            templateId: parseInt(templateId),
            contact: form.contact.trim()
        };

        console.log('Sending application:', applicationData);

        try {
            const res = await fetch(`${API_BASE_URL}/api/applications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(applicationData)
            });

            if (!res.ok) {
                const text = await res.text();
                let errorMessage = `Ошибка ${res.status}`;

                try {
                    const errorData = JSON.parse(text);
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    errorMessage = text || errorMessage;
                }

                throw new Error(errorMessage);
            }

            const data = await res.json();
            console.log('Application created:', data);
            onSuccess();

        } catch (err) {
            console.error('Create application error:', err);
            setError('Ошибка создания заявки: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError('');
    };

    const handleContactTypeChange = (type) => {
        setContactType(type);
        // Очищаем поле контакта при смене типа
        setForm({ contact: '' });
    };

    const getPlaceholder = () => {
        switch (contactType) {
            case 'telegram':
                return '@username или +79123456789';
            case 'whatsapp':
                return '+79123456789';
            case 'vk':
                return 'id1234567 или https://vk.com/username';

            case 'phone':
                return '+7 (123) 456-78-90';
            default:
                return 'Контактные данные';
        }
    };

    const getIcon = () => {
        switch (contactType) {
            case 'telegram':
                return '📱';
            case 'whatsapp':
                return '💬';
            case 'vk':
                return '👥';

            case 'phone':
                return '📞';
            default:
                return '📝';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(6px)'
        }} onClick={onClose}>
            <div style={{
                background: 'linear-gradient(145deg, #ffffff, #f5f9ff)',
                borderRadius: '24px',
                padding: '2.5rem',
                width: '90%',
                maxWidth: '500px',
                boxShadow: '0 25px 70px rgba(0, 0, 0, 0.35)',
                position: 'relative',
                borderTop: '6px solid #4CAF50',
                animation: 'modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }} onClick={e => e.stopPropagation()}>

                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#f5f5f5',
                        border: 'none',
                        fontSize: '24px',
                        color: '#666',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        padding: 0,
                        lineHeight: 1
                    }}
                    onMouseOver={(e) => {
                        e.target.style.background = '#ff4444';
                        e.target.style.color = 'white';
                        e.target.style.transform = 'rotate(90deg)';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.background = '#f5f5f5';
                        e.target.style.color = '#666';
                        e.target.style.transform = 'rotate(0deg)';
                    }}
                >
                    ×
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{
                        margin: '0 0 0.5rem',
                        color: '#4CAF50',
                        fontSize: '1.8rem',
                        fontWeight: 700
                    }}>
                        Оставить заявку
                    </h2>
                    <p style={{
                        color: '#666',
                        fontSize: '1rem',
                        background: '#e8f5e9',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        display: 'inline-block',
                        marginTop: '0.5rem'
                    }}>
                        Проект: <strong>{templateTitle}</strong>
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'flex',
                            marginBottom: '0.5rem',
                            fontWeight: 600,
                            color: '#333',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span style={{ color: '#f44336' }}>*</span> Способ связи
                        </label>

                        {/* Выбор типа контакта */}
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginBottom: '1rem',
                            padding: '10px',
                            background: '#f8f9fa',
                            borderRadius: '10px',
                            border: '1px solid #e0e0e0'
                        }}>
                            {[
                                { type: 'telegram', label: 'Telegram', icon: '📱' },
                                { type: 'whatsapp', label: 'WhatsApp', icon: '💬' },
                                { type: 'vk', label: 'ВКонтакте', icon: '👥' },
                                { type: 'phone', label: 'Телефон', icon: '📞' }
                            ].map(item => (
                                <button
                                    key={item.type}
                                    type="button"
                                    onClick={() => handleContactTypeChange(item.type)}
                                    style={{
                                        flex: 1,
                                        minWidth: '80px',
                                        padding: '10px 8px',
                                        borderRadius: '8px',
                                        border: contactType === item.type
                                            ? '2px solid #4CAF50'
                                            : '1px solid #e0e0e0',
                                        background: contactType === item.type
                                            ? '#e8f5e9'
                                            : '#ffffff',
                                        color: contactType === item.type
                                            ? '#2E7D32'
                                            : '#666',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '5px',
                                        fontSize: '0.85rem',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Поле для ввода контакта */}
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '1.2rem',
                                color: '#4CAF50'
                            }}>
                                {getIcon()}
                            </div>
                            <input
                                required
                                name="contact"
                                style={{
                                    width: '100%',
                                    padding: '14px 16px 14px 50px',
                                    border: '2px solid #e3f2fd',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    background: '#fafcff',
                                    transition: 'all 0.3s ease',
                                    boxSizing: 'border-box'
                                }}
                                value={form.contact}
                                onChange={handleChange}
                                placeholder={getPlaceholder()}
                                disabled={loading}
                            />
                        </div>

                        {/* Подсказка для текущего типа контакта */}
                        <p style={{
                            fontSize: '0.85rem',
                            color: '#666',
                            marginTop: '0.5rem',
                            padding: '8px 12px',
                            background: '#f0f8ff',
                            borderRadius: '6px',
                            borderLeft: '3px solid #2196F3'
                        }}>
                            {contactType === 'telegram' && 'Введите @username или номер телефона для Telegram'}
                            {contactType === 'whatsapp' && 'Введите номер телефона для WhatsApp'}
                            {contactType === 'vk' && 'Введите ID страницы или ссылку на ВКонтакте'}
                            {contactType === 'email' && 'Введите адрес электронной почты'}
                            {contactType === 'phone' && 'Введите номер телефона для звонка'}
                        </p>
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            background: '#ffebee',
                            border: '1px solid #ffcdd2',
                            color: '#d32f2f',
                            marginBottom: '1.5rem',
                            fontSize: '0.9rem'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '1rem'
                    }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '16px 32px',
                                borderRadius: '12px',
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
                                color: 'white',
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                minWidth: '200px',
                                opacity: loading ? 0.7 : 1
                            }}
                            onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
                            onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
                        >
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <span style={{
                                        width: '20px',
                                        height: '20px',
                                        border: '2px solid rgba(255, 255, 255, 0.3)',
                                        borderRadius: '50%',
                                        borderTopColor: 'white',
                                        animation: 'spin 1s ease-in-out infinite'
                                    }}></span>
                                    Отправка...
                                </span>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    Отправить заявку
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '16px 32px',
                                borderRadius: '12px',
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                background: 'transparent',
                                border: '2px solid #e0e0e0',
                                color: '#666',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                minWidth: '150px'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = '#f5f5f5';
                                e.target.style.borderColor = '#2196F3';
                                e.target.style.color = '#2196F3';
                                e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.borderColor = '#e0e0e0';
                                e.target.style.color = '#666';
                                e.target.style.transform = 'translateY(0)';
                            }}
                            disabled={loading}
                        >
                            Отмена
                        </button>
                    </div>

                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: '#666',
                        textAlign: 'center'
                    }}>
                        <p style={{ margin: 0 }}>
                            ⏰ После отправки заявки с вами свяжется наш менеджер в течение 24 часов
                        </p>
                    </div>
                </form>

                <style jsx="true">{`
                    @keyframes modalSlideIn {
                        from {
                            opacity: 0;
                            transform: translateY(30px) scale(0.95);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }
                    
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
}