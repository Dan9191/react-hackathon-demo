import React, { useState } from 'react';
import { getConfig } from '../config';

export default function OrderModal({ token, templateId, templateTitle, onClose, onSuccess }) {
    const [form, setForm] = useState({
        address: '',
        comment: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!form.address.trim()) {
            setError('Пожалуйста, укажите адрес строительства');
            return;
        }

        setLoading(true);
        setError('');

        const { API_BASE_URL } = getConfig();
        const orderData = {
            projectId: parseInt(templateId),
            address: form.address.trim(),
            comment: form.comment.trim() || undefined
        };
        console.log(orderData);
        try {
            const res = await fetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
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
            console.log('Order created:', data);
            onSuccess();
            
        } catch (err) {
            console.error('Create order error:', err);
            setError('Ошибка создания заказа: ' + err.message);
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
                        📝 Оформление заказа
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
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: 600,
                            color: '#333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span style={{ color: '#f44336' }}>*</span> Адрес строительства
                        </label>
                        <input
                            required
                            name="address"
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                border: '2px solid #e3f2fd',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                background: '#fafcff',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box'
                            }}
                            value={form.address}
                            onChange={handleChange}
                            placeholder="г. Москва, ул. Ленина, д. 10"
                            disabled={loading}
                        />
                        <p style={{
                            fontSize: '0.85rem',
                            color: '#666',
                            marginTop: '0.5rem'
                        }}>
                            Укажите полный адрес, где планируется строительство
                        </p>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: 600,
                            color: '#333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            Комментарий к заказу
                        </label>
                        <textarea
                            name="comment"
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                border: '2px solid #e3f2fd',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                background: '#fafcff',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box',
                                minHeight: '120px',
                                resize: 'vertical',
                                fontFamily: 'inherit'
                            }}
                            value={form.comment}
                            onChange={handleChange}
                            placeholder="Участок с уклоном, особые пожелания, предпочтения по материалам..."
                            disabled={loading}
                        />
                        <p style={{
                            fontSize: '0.85rem',
                            color: '#666',
                            marginTop: '0.5rem'
                        }}>
                            Укажите дополнительные сведения, которые помогут в проектировании
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
                                    <span>✅</span> Создать заказ
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
                            ⏰ После оформления заказа с вами свяжется наш менеджер в течение 24 часов
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