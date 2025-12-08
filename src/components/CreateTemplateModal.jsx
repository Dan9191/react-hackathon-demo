// CreateTemplateModal.jsx
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!files.length) {
            alert('Добавьте хотя бы одно изображение');
            return;
        }

        setLoading(true);
        const { API_BASE_URL, TEMPLATES_CREATE_URL } = getConfig();

        const formData = new FormData();
        formData.append('data', JSON.stringify(form)); // ← как строка, как в Insomnia
        files.forEach(file => formData.append('files', file));

        try {
            const res = await fetch(`${API_BASE_URL}${TEMPLATES_CREATE_URL}`, {
                method: 'POST',
                headers: {
                    // НЕ указываем Content-Type — браузер сам добавит правильный boundary
                    Authorization: `Bearer ${token}`
                },
                body: formData,
                credentials: 'include' // ← ВАЖНО! Отправляет JSESSIONID и все куки, как в Insomnia
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

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }} onClick={onClose}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }} onClick={e => e.stopPropagation()}>

                <h2 style={{ margin: '0 0 1.5rem', color: '#2196F3', textAlign: 'center' }}>
                    Создать новый шаблон дома
                </h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="form-label">Название проекта *</label>
                        <input
                            required
                            className="form-control"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="Например: Сканди 95 м²"
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="form-label">Описание</label>
                        <textarea
                            className="form-control"
                            rows="3"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Подробное описание дома..."
                        />
                    </div>

                    <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="form-label">Стиль</label>
                            <input
                                className="form-control"
                                value={form.style}
                                onChange={e => setForm({ ...form, style: e.target.value })}
                                placeholder="сканди, минимализм, классика..."
                            />
                        </div>
                        <div>
                            <label className="form-label">Площадь (м²) *</label>
                            <input
                                required
                                type="number"
                                step="0.1"
                                className="form-control"
                                value={form.areaM2}
                                onChange={e => setForm({ ...form, areaM2: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1rem 0' }}>
                        <div>
                            <label className="form-label">Комнат *</label>
                            <input
                                required
                                type="number"
                                min="1"
                                className="form-control"
                                value={form.rooms}
                                onChange={e => setForm({ ...form, rooms: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Базовая цена (₽) *</label>
                            <input
                                required
                                type="number"
                                className="form-control"
                                value={form.basePrice}
                                onChange={e => setForm({ ...form, basePrice: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ margin: '1.5rem 0' }}>
                        <label className="form-label">Фотографии и документы *</label>
                        <input
                            type="file"
                            multiple
                            accept="image/*,application/pdf"
                            onChange={e => setFiles(Array.from(e.target.files))}
                            style={{ width: '100%', padding: '0.5rem' }}
                        />
                        <small style={{ color: '#666' }}>
                            Первое изображение станет превью. Можно добавить PDF сметы.
                        </small>
                        {files.length > 0 && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#2196F3' }}>
                                Выбрано файлов: {files.length}
                            </div>
                        )}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ padding: '12px 32px', fontSize: '1.1rem' }}
                        >
                            {loading ? 'Создаём...' : 'Создать шаблон'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-outline"
                            style={{ marginLeft: '1rem' }}
                            disabled={loading}
                        >
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}