import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getConfig } from '../config';

export default function CreateApplication({ token }) {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [form, setForm] = useState({
        clientId: '',
        address: '',
        description: '',
        phone: ''
    });
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (token && userId) {
            fetchUserAndTemplates();
        }
    }, [token, userId]);

    const fetchUserAndTemplates = async () => {
        try {
            const { API_BASE_URL } = getConfig();

            // Получаем пользователя
            const userRes = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!userRes.ok) throw new Error('Пользователь не найден');
            const userData = await userRes.json();
            setUser(userData);
            setForm(prev => ({ ...prev, clientId: userId }));

            // Получаем шаблоны
            const templatesRes = await fetch(`${API_BASE_URL}/api/templates`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (templatesRes.ok) {
                const data = await templatesRes.json();
                setTemplates(data.content || []);
            }

            setLoading(false);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.address.trim()) {
            alert('Укажите адрес строительства');
            return;
        }

        setSubmitting(true);

        try {
            const { API_BASE_URL } = getConfig();
            const applicationData = {
                clientId: userId,
                address: form.address,
                description: form.description,
                phone: form.phone,
                templateId: selectedTemplate || undefined
            };

            // Убираем пустые поля
            Object.keys(applicationData).forEach(key => {
                if (!applicationData[key]) delete applicationData[key];
            });

            const response = await fetch(`${API_BASE_URL}/api/applications`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(applicationData)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Ошибка ${response.status}: ${text}`);
            }

            const data = await response.json();
            alert('✅ Заявка успешно создана!');
            navigate(`/admin/user/${userId}/applications`);

        } catch (err) {
            console.error('Ошибка создания заявки:', err);
            alert('Ошибка создания заявки: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (!user) return <div className="error">Пользователь не найден</div>;

    return (
        <div className="create-application-page">
            <div className="header-section">
                <button onClick={() => navigate(-1)} className="back-link">
                    ← Назад
                </button>
                <h1>📝 Создание заявки</h1>
                <div className="client-info">
                    <div className="client-avatar">
                        {user.fullName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <h2>{user.fullName}</h2>
                        <p>📧 {user.email}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="application-form">
                <div className="form-section">
                    <h3>📋 Основная информация</h3>

                    <div className="form-group">
                        <label>📍 Адрес строительства *</label>
                        <input
                            type="text"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            placeholder="г. Москва, ул. Ленина, д. 10"
                            className="form-control"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>📞 Телефон для связи</label>
                        <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="+7 (XXX) XXX-XX-XX"
                            className="form-control"
                        />
                    </div>

                    <div className="form-group">
                        <label>🏠 Выберите проект (опционально)</label>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className="form-control"
                        >
                            <option value="">Выберите проект...</option>
                            {templates.map(template => (
                                <option key={template.id} value={template.id}>
                                    {template.title} ({template.areaM2} м², {template.basePrice} ₽)
                                </option>
                            ))}
                        </select>
                        {selectedTemplate && templates.find(t => t.id == selectedTemplate) && (
                            <div className="template-preview">
                                <p>
                                    <strong>Выбран:</strong> {templates.find(t => t.id == selectedTemplate).title}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-section">
                    <h3>📝 Детали заявки</h3>

                    <div className="form-group">
                        <label>💬 Описание / особые пожелания</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Описание участка, особые требования, пожелания по материалам..."
                            className="form-control"
                            rows="5"
                        />
                        <p className="form-hint">
                            Опишите все детали, которые помогут в проектировании и строительстве
                        </p>
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn btn-primary btn-large"
                    >
                        {submitting ? (
                            <>
                                <span className="spinner"></span>
                                Создание...
                            </>
                        ) : '✅ Создать заявку'}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="btn btn-outline"
                    >
                        Отмена
                    </button>
                </div>
            </form>

            <div className="form-info">
                <div className="info-card">
                    <h4>📋 Что будет после создания заявки?</h4>
                    <ol>
                        <li>Заявка появится в списке заявок администратора</li>
                        <li>Администратор может взять её в работу или отклонить</li>
                        <li>При принятии в работу будет создан заказ</li>
                        <li>Заказ появится в личном кабинете пользователя</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}