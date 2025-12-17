import React, { useState } from 'react';
import { getConfig } from '../config';

export default function CreateTemplateModal({ token, onClose, onSuccess }) {
    const [form, setForm] = useState({
        title: '',
        description: '',
        style: '',
        areaM2: '',
        rooms: '',
        basePrice: '',
        isActive: true
    });
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!files.length) {
            alert('Добавьте хотя бы одно изображение');
            return;
        }

        setLoading(true);
        const { API_BASE_URL, TEMPLATES_CREATE_URL } = getConfig();

        const formData = new FormData();
        formData.append('data', JSON.stringify(form));
        files.forEach(file => formData.append('files', file));

        try {
            const res = await fetch(`${API_BASE_URL}${TEMPLATES_CREATE_URL}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData,
                credentials: 'include'
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Ошибка ${res.status}: ${text || 'Нет ответа от сервера'}`);
            }

            alert('Шаблон успешно создан!');
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error('Create template error:', err);
            alert('Ошибка создания шаблона: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        setFiles(Array.from(e.dataTransfer.files));
    };

    const removeFile = (index) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        setFiles(newFiles);
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(6px)'
        }} onClick={onClose}>
            <div style={{
                background: 'linear-gradient(145deg, #ffffff, #f5f9ff)',
                borderRadius: '24px',
                padding: '2.5rem',
                width: '90%',
                maxWidth: '700px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
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
                        lineHeight: 1,
                        zIndex: 1
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
                        🏠 Создать новый шаблон дома
                    </h2>
                    <p style={{ color: '#666', fontSize: '0.95rem' }}>
                        Заполните все обязательные поля (*) для создания шаблона
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                        gap: '1.5rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontWeight: 600,
                                color: '#333',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ color: '#f44336' }}>*</span> Название проекта
                            </label>
                            <input
                                required
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
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="Например: Сканди 95 м²"
                            />
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontWeight: 600,
                                color: '#333',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                Стиль
                            </label>
                            <input
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
                                value={form.style}
                                onChange={e => setForm({ ...form, style: e.target.value })}
                                placeholder="сканди, минимализм, классика..."
                            />
                        </div>
                    </div>

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
                            Описание
                        </label>
                        <textarea
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                border: '2px solid #e3f2fd',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                background: '#fafcff',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box',
                                minHeight: '100px',
                                resize: 'vertical',
                                fontFamily: 'inherit'
                            }}
                            rows="3"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Подробное описание дома, особенности планировки, материалы..."
                        />
                    </div>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '1.5rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontWeight: 600,
                                color: '#333',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ color: '#f44336' }}>*</span> Площадь (м²)
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    required
                                    type="number"
                                    step="0.1"
                                    min="10"
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
                                    value={form.areaM2}
                                    onChange={e => setForm({ ...form, areaM2: e.target.value })}
                                    placeholder="95.5"
                                />
                                <span style={{
                                    position: 'absolute',
                                    left: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#2196F3',
                                    fontWeight: 600
                                }}>㎡</span>
                            </div>
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontWeight: 600,
                                color: '#333',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ color: '#f44336' }}>*</span> Комнат
                            </label>
                            <input
                                required
                                type="number"
                                min="1"
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
                                value={form.rooms}
                                onChange={e => setForm({ ...form, rooms: e.target.value })}
                                placeholder="3"
                            />
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontWeight: 600,
                                color: '#333',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ color: '#f44336' }}>*</span> Базовая цена (₽)
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    required
                                    type="number"
                                    min="0"
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
                                    value={form.basePrice}
                                    onChange={e => setForm({ ...form, basePrice: e.target.value })}
                                    placeholder="2500000"
                                />
                                <span style={{
                                    position: 'absolute',
                                    left: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#2196F3',
                                    fontWeight: 600
                                }}>₽</span>
                            </div>
                        </div>
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
                            <span style={{ color: '#f44336' }}>*</span> Фотографии и документы
                        </label>
                        
                        <div 
                            style={{
                                border: `2px dashed ${dragOver ? '#2196F3' : '#90caf9'}`,
                                borderRadius: '12px',
                                padding: '2rem',
                                textAlign: 'center',
                                transition: 'all 0.3s',
                                background: dragOver ? '#e3f2fd' : '#f8fdff',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('file-upload').click()}
                        >
                            <input
                                type="file"
                                multiple
                                accept="image/*,application/pdf"
                                onChange={handleFileChange}
                                id="file-upload"
                                style={{ display: 'none' }}
                            />
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📎</div>
                            <div style={{ fontSize: '1.1rem', color: '#546e7a', marginBottom: '0.5rem' }}>
                                Нажмите для выбора файлов
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#90a4ae' }}>
                                или перетащите файлы сюда
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#78909c', marginTop: '1rem' }}>
                                Поддерживаемые форматы: JPG, PNG, PDF (макс. 10MB)
                            </div>
                        </div>

                        {files.length > 0 && (
                            <div style={{ marginTop: '1.5rem' }}>
                                <div style={{ 
                                    fontSize: '0.95rem', 
                                    color: '#37474f', 
                                    marginBottom: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span>📁</span> Выбрано файлов: {files.length}
                                </div>
                                <div style={{ 
                                    maxHeight: '200px', 
                                    overflowY: 'auto',
                                    background: '#fafafa',
                                    borderRadius: '8px',
                                    padding: '1rem'
                                }}>
                                    {files.map((file, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px 12px',
                                            background: 'white',
                                            borderRadius: '8px',
                                            marginBottom: '5px',
                                            border: '1px solid #e0e0e0'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '1.2rem' }}>
                                                    {file.type.startsWith('image/') ? '🖼️' : '📄'}
                                                </span>
                                                <span style={{ fontSize: '0.9rem' }}>{file.name}</span>
                                                <span style={{ 
                                                    fontSize: '0.8rem', 
                                                    color: '#78909c',
                                                    marginLeft: '10px'
                                                }}>
                                                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                                </span>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFile(index);
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#f44336',
                                                    fontSize: '1.5rem',
                                                    cursor: 'pointer',
                                                    padding: '0 5px',
                                                    transition: 'color 0.2s'
                                                }}
                                                onMouseOver={(e) => e.target.style.color = '#d32f2f'}
                                                onMouseOut={(e) => e.target.style.color = '#f44336'}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ 
                                    fontSize: '0.85rem', 
                                    color: '#4CAF50', 
                                    marginTop: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span>💡</span> Первое изображение станет превью на главной странице
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: '1rem',
                        marginTop: '2rem'
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
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                minWidth: '200px',
                                position: 'relative',
                                overflow: 'hidden'
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
                                    Создаём...
                                </span>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <span>✅</span> Создать шаблон
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
                </form>
            </div>

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
    );
}