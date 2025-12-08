import React, { useEffect, useState } from 'react';
import { getConfig } from '../config';

export default function PublicContent() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const { API_BASE_URL, TEMPLATES_LIST_URL } = getConfig();
        fetch(`${API_BASE_URL}${TEMPLATES_LIST_URL}`)
            .then(r => r.json())
            .then(data => {
                setTemplates(data.content || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load templates:', err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Загрузка шаблонов...</div>;

    return (
        <main className="container" style={{ padding: '2rem 0' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#2196F3' }}>
                Каталог домов
            </h1>

            <div className="project-grid">
                {templates.map(t => (
                    <div key={t.id} className="project-card">
                        <div className="project-image">
                            {t.previewUrl ? (
                                <img src={t.previewUrl} alt={t.title} />
                            ) : (
                                <div style={{ background: '#eee', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    Нет фото
                                </div>
                            )}
                        </div>
                        <div className="project-info">
                            <h3>{t.title}</h3>
                            <p><strong>Стиль:</strong> {t.style || '—'}</p>
                            <p><strong>Площадь:</strong> {t.areaM2} м²</p>
                            <p><strong>Комнаты:</strong> {t.rooms}</p>
                            <p className="price">{Number(t.basePrice).toLocaleString()} ₽</p>
                        </div>
                    </div>
                ))}
            </div>

            {templates.length === 0 && !loading && (
                <p style={{ textAlign: 'center', color: '#999', fontSize: '1.2rem' }}>
                    Шаблоны ещё не добавлены
                </p>
            )}
        </main>
    );
}