import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getConfig } from '../config';

export default function TemplateDetail({ token }) {
    const { id } = useParams();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const { API_BASE_URL } = getConfig();
        fetch(`${API_BASE_URL}/api/templates/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
            .then(r => r.json())
            .then(data => {
                setTemplate(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id, token]);

    if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Загрузка...</div>;
    if (!template) return <div style={{ padding: '4rem', textAlign: 'center' }}>Шаблон не найден</div>;

    const previews = template.files?.filter(f => f.fileRole === 'preview' || f.fileRole === 'gallery') || [];
    const documents = template.files?.filter(f => f.fileRole === 'document') || [];

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <Link to="/" style={{ color: '#2196F3', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
                ← Назад к каталогу
            </Link>

            <h1 style={{ fontSize: '2.5rem', margin: '1rem 0', color: '#2196F3' }}>{template.title}</h1>

            {template.description && <p style={{ fontSize: '1.2rem', color: '#555' }}>{template.description}</p>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', margin: '2rem 0' }}>
                <div>
                    <strong>Стиль:</strong> {template.style || '—'}
                </div>
                <div>
                    <strong>Площадь:</strong> {template.areaM2} м²
                </div>
                <div>
                    <strong>Комнаты:</strong> {template.rooms}
                </div>
                <div>
                    <strong>Цена:</strong> {Number(template.basePrice).toLocaleString()} ₽
                </div>
            </div>

            {previews.length > 0 && (
                <>
                    <h2 style={{ margin: '2rem 0 1rem', color: '#2196F3' }}>Фотографии</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {previews.map(file => (
                            <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={file.url}
                                    alt={file.filename}
                                    style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '12px' }}
                                />
                            </a>
                        ))}
                    </div>
                </>
            )}

            {documents.length > 0 && (
                <>
                    <h2 style={{ margin: '2rem 0 1rem', color: '#2196F3' }}>Документы</h2>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {documents.map(file => (
                            <li key={file.id} style={{ margin: '0.5rem 0' }}>
                                <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3' }}>
                                    {file.filename}
                                </a>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}