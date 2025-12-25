import React, { useState, useEffect } from 'react';
import { getConfig } from '../config';

export default function EditTemplateModal({ token, templateId, onClose, onSuccess }) {
    const [form, setForm] = useState({
        title: '',
        description: '',
        style: '',
        areaM2: '',
        rooms: '',
        basePrice: '',
        isActive: true,
        descriptionError: null
    });
    const [files, setFiles] = useState([]);
    const [existingFiles, setExistingFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [dragOver, setDragOver] = useState(false);
    const [initialDescription, setInitialDescription] = useState('');

    useEffect(() => {
        const fetchTemplate = async () => {
            if (!templateId) {
                setFetching(false);
                return;
            }

            const { API_BASE_URL } = getConfig();

            try {
                setFetching(true);
                const res = await fetch(`${API_BASE_URL}/api/templates/${templateId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    throw new Error(`Ошибка загрузки шаблона: ${res.status}`);
                }

                const template = await res.json();
                // console.log('Получен шаблон:', template);

                const description = template.description || '';
                setInitialDescription(description);
                setForm({
                    title: template.title || '',
                    description: description,
                    style: template.style || '',
                    areaM2: template.areaM2?.toString() || '',
                    rooms: template.rooms?.toString() || '',
                    basePrice: template.basePrice?.toString() || '',
                    isActive: template.isActive !== undefined ? template.isActive : true,
                    descriptionError: null
                });
                setExistingFiles(template.files || []);
            } catch (err) {
                console.error('Ошибка загрузки шаблона:', err);
                alert('Не удалось загрузить данные шаблона: ' + err.message);
                onClose?.();
            } finally {
                setFetching(false);
            }
        };

        fetchTemplate();
    }, [templateId, token, onClose]);

    const validateForm = () => {
        const errors = {};
        let isValid = true;

        // Проверка названия
        if (!form.title.trim()) {
            errors.title = 'Название обязательно';
            isValid = false;
        }

        // Проверка описания
        const descriptionToCheck = form.description || initialDescription;
        if (!descriptionToCheck.trim()) {
            errors.description = 'Описание обязательно для заполнения';
            isValid = false;
        } else if (descriptionToCheck.trim().length < 10) {
            errors.description = 'Описание должно содержать минимум 10 символов';
            isValid = false;
        }

        // Проверка площади
        const areaM2 = parseFloat(form.areaM2);
        if (!form.areaM2 || isNaN(areaM2) || areaM2 <= 0) {
            errors.areaM2 = 'Площадь должна быть положительным числом';
            isValid = false;
        }

        // Проверка комнат
        const rooms = parseInt(form.rooms);
        if (!form.rooms || isNaN(rooms) || rooms <= 0) {
            errors.rooms = 'Количество комнат должно быть положительным целым числом';
            isValid = false;
        }

        // Проверка цены
        const basePrice = parseFloat(form.basePrice);
        if (!form.basePrice || isNaN(basePrice) || basePrice <= 0) {
            errors.basePrice = 'Базовая цена должна быть положительным числом';
            isValid = false;
        }

        return { isValid, errors };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Валидация формы
        const validation = validateForm();
        if (!validation.isValid) {
            if (validation.errors.description) {
                setForm(prev => ({ ...prev, descriptionError: validation.errors.description }));
            }

            alert('Пожалуйста, исправьте ошибки в форме:\n' + Object.values(validation.errors).join('\n'));
            return;
        }

        setLoading(true);
        const { API_BASE_URL } = getConfig();

        // Используем текущее значение description или начальное, если поле не менялось
        const descriptionToSend = form.description !== '' ? form.description : initialDescription;

        // Подготавливаем данные в том же формате, что и при создании
        const templateData = {
            title: form.title.trim(),
            description: descriptionToSend.trim(),
            style: form.style.trim() || '',
            areaM2: parseFloat(form.areaM2) || 0,
            rooms: parseInt(form.rooms) || 1,
            basePrice: parseInt(form.basePrice) || 0,
            isActive: Boolean(form.isActive)
        };

        //console.log('Отправляемые данные:', templateData);

        const formData = new FormData();

        // Используем тот же ключ, что и при создании
        formData.append('data', JSON.stringify(templateData));

        // Используем тот же ключ для файлов, что и при создании
        if (files && files.length > 0) {
            files.forEach((file) => {
                formData.append('files', file);
            });
        }

        // Отладочный вывод содержимого FormData
        // console.log('Содержимое FormData:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }

        try {
            //console.log('Отправка PUT запроса на обновление шаблона:', templateId);

            const res = await fetch(`${API_BASE_URL}/api/templates/${templateId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData,
                credentials: 'include'
            });

            //console.log('Статус ответа:', res.status);

            if (!res.ok) {
                let errorMessage = `Ошибка ${res.status}`;
                try {
                    const errorData = await res.json().catch(() => ({}));
                    console.error('Данные ошибки:', errorData);

                    if (errorData.message || errorData.error) {
                        errorMessage = `Ошибка ${res.status}: ${errorData.message || errorData.error}`;
                    }
                } catch (parseError) {
                    console.error('Ошибка парсинга ответа:', parseError);
                }
                throw new Error(errorMessage);
            }

            const updatedTemplate = await res.json();
            //console.log('Шаблон успешно обновлен:', updatedTemplate);

            alert('Шаблон успешно обновлен!');
            onSuccess?.(updatedTemplate);
        } catch (err) {
            console.error('Ошибка обновления шаблона:', err);
            alert('Ошибка обновления шаблона: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        setForm(prev => ({
            ...prev,
            description: value,
            descriptionError: null
        }));
    };

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files);
        setFiles(prev => [...prev, ...newFiles]);
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
        const newFiles = Array.from(e.dataTransfer.files);
        setFiles(prev => [...prev, ...newFiles]);
    };

    const removeNewFile = (index) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        setFiles(newFiles);
    };

    const removeExistingFile = async (fileId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот файл?')) return;

        const { API_BASE_URL } = getConfig();

        try {
            const res = await fetch(`${API_BASE_URL}/api/files/${fileId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Ошибка ${res.status}: ${errorText}`);
            }

            setExistingFiles(existingFiles.filter(f => f.id !== fileId));
            alert('Файл успешно удален');
        } catch (err) {
            console.error('Ошибка удаления файла:', err);
            alert('Ошибка удаления файла: ' + err.message);
        }
    };

    if (fetching) {
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
            }}>
                <div style={{
                    background: 'linear-gradient(145deg, #ffffff, #f5f9ff)',
                    borderRadius: '24px',
                    padding: '3rem',
                    textAlign: 'center',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                    <div style={{ fontSize: '1.2rem', color: '#666' }}>
                        Загрузка данных шаблона...
                    </div>
                </div>
            </div>
        );
    }

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
                borderTop: '6px solid #FF9800',
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
                        color: '#FF9800',
                        fontSize: '1.8rem',
                        fontWeight: 700
                    }}>
                        ✏️ Редактировать шаблон
                    </h2>
                    <p style={{ color: '#666', fontSize: '0.95rem' }}>
                        Редактирование проекта "{form.title}"
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
                                disabled={loading}
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
                                disabled={loading}
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
                            <span style={{ color: '#f44336' }}>*</span> Описание
                        </label>
                        <textarea
                            required
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                border: form.descriptionError ? '2px solid #f44336' : '2px solid #e3f2fd',
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
                            onChange={handleDescriptionChange}
                            placeholder="Подробное описание дома, особенности планировки, материалы..."
                            disabled={loading}
                        />

                        {form.descriptionError && (
                            <div style={{
                                color: '#f44336',
                                fontSize: '0.85rem',
                                marginTop: '0.5rem',
                                padding: '8px 12px',
                                background: '#ffebee',
                                borderRadius: '8px',
                                border: '1px solid #ffcdd2',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span>⚠️</span>
                                <span>{form.descriptionError}</span>
                            </div>
                        )}

                        <div style={{
                            fontSize: '0.8rem',
                            color: form.descriptionError ? '#f44336' : '#666',
                            marginTop: '0.5rem',
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}>
                            <span>
                                Текущая длина: {(form.description || initialDescription).length} символов
                            </span>
                            <span>
                                Минимум: 10 символов
                            </span>
                        </div>
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
                                    disabled={loading}
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
                                step="1"
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
                                disabled={loading}
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
                                    step="0.01"
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
                                    placeholder="2500000.00"
                                    disabled={loading}
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
                                Статус
                            </label>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '2px 15px 2px 2px',
                                background: '#fafcff',
                                borderRadius: '12px',
                                border: '2px solid #e3f2fd',
                                opacity: loading ? 0.6 : 1
                            }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    flex: 1,
                                    background: form.isActive ? '#e8f5e9' : 'transparent',
                                    transition: 'all 0.3s ease',
                                    border: form.isActive ? '1px solid #c8e6c9' : '1px solid transparent'
                                }}>
                                    <input
                                        type="radio"
                                        name="status"
                                        checked={form.isActive === true}
                                        onChange={() => setForm({ ...form, isActive: true })}
                                        style={{
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            accentColor: '#4CAF50'
                                        }}
                                        disabled={loading}
                                    />
                                    <span style={{
                                        color: form.isActive ? '#2E7D32' : '#666',
                                        fontWeight: form.isActive ? 600 : 400
                                    }}>
                                        <span style={{ marginRight: '5px' }}>✅</span>
                                        Активен
                                    </span>
                                </label>

                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    flex: 1,
                                    background: form.isActive === false ? '#fff3e0' : 'transparent',
                                    transition: 'all 0.3s ease',
                                    border: form.isActive === false ? '1px solid #ffccbc' : '1px solid transparent'
                                }}>
                                    <input
                                        type="radio"
                                        name="status"
                                        checked={form.isActive === false}
                                        onChange={() => setForm({ ...form, isActive: false })}
                                        style={{
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            accentColor: '#FF9800'
                                        }}
                                        disabled={loading}
                                    />
                                    <span style={{
                                        color: form.isActive === false ? '#EF6C00' : '#666',
                                        fontWeight: form.isActive === false ? 600 : 400
                                    }}>
                                        <span style={{ marginRight: '5px' }}>⏸️</span>
                                        Неактивен
                                    </span>
                                </label>
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
                            Существующие файлы
                        </label>

                        {existingFiles.length > 0 ? (
                            <div style={{
                                maxHeight: '200px',
                                overflowY: 'auto',
                                background: '#fafafa',
                                borderRadius: '8px',
                                padding: '1rem',
                                marginBottom: '1rem'
                            }}>
                                {existingFiles.map((file, index) => (
                                    <div key={file.id} style={{
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
                                                {file.fileRole === 'document' ? '📄' : '🖼️'}
                                            </span>
                                            <span style={{ fontSize: '0.9rem' }}>{file.filename}</span>
                                            <span style={{
                                                fontSize: '0.8rem',
                                                color: '#78909c',
                                                marginLeft: '10px'
                                            }}>
                                                {file.fileSize && `(${(file.fileSize / 1024 / 1024).toFixed(2)} MB)`}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeExistingFile(file.id)}
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
                                            disabled={loading}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                Нет загруженных файлов
                            </p>
                        )}

                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: 600,
                            color: '#333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            Добавить новые файлы
                        </label>

                        <div
                            style={{
                                border: `2px dashed ${dragOver ? '#2196F3' : '#90caf9'}`,
                                borderRadius: '12px',
                                padding: '2rem',
                                textAlign: 'center',
                                transition: 'all 0.3s',
                                background: dragOver ? '#e3f2fd' : '#f8fdff',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                position: 'relative',
                                opacity: loading ? 0.6 : 1
                            }}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={loading ? undefined : handleDrop}
                            onClick={loading ? undefined : () => document.getElementById('file-upload').click()}
                        >
                            <input
                                type="file"
                                multiple
                                accept="image/*,application/pdf"
                                onChange={handleFileChange}
                                id="file-upload"
                                style={{ display: 'none' }}
                                disabled={loading}
                            />
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📎</div>
                            <div style={{ fontSize: '1.1rem', color: '#546e7a', marginBottom: '0.5rem' }}>
                                {loading ? 'Загрузка...' : 'Нажмите для выбора файлов'}
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
                                    <span>📁</span> Новые файлы: {files.length}
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
                                                onClick={() => removeNewFile(index)}
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
                                                disabled={loading}
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
                                background: loading
                                    ? '#bdbdbd'
                                    : 'linear-gradient(135deg, #FF9800, #F57C00)',
                                color: 'white',
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
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
                                    Обновляем...
                                </span>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <span>💾</span> Обновить шаблон
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
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                minWidth: '150px',
                                opacity: loading ? 0.5 : 1
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
                
                /* Стили для кастомного скроллбара */
::-webkit-scrollbar {
    width: 12px;
}

::-webkit-scrollbar-track {
    background: transparent;
    margin: 8px 0; /* Отступы сверху и снизу */
    border-radius: 10px;
}

::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    border: 4px solid transparent; /* Отступы вокруг бегунка */
    background-clip: padding-box;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
    border: 4px solid transparent;
    background-clip: padding-box;
}

/* Для внутренних контейнеров с прокруткой */
div[style*="overflowY: auto"] {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
    padding-right: 4px;
}

div[style*="overflowY: auto"]::-webkit-scrollbar {
    width: 8px;
}

div[style*="overflowY: auto"]::-webkit-scrollbar-track {
    background: transparent;
    margin: 4px 0; /* Меньшие отступы */
    border-radius: 8px;
}

div[style*="overflowY: auto"]::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    border: 3px solid transparent; /* Отступы поменьше */
    background-clip: padding-box;
    min-height: 30px; /* Минимальная высота */
}

div[style*="overflowY: auto"]::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.25);
    border: 3px solid transparent;
    background-clip: padding-box;
}
            `}</style>
        </div>
    );
}