import React, { useState } from 'react';
import { getAuthConfig } from '../auth-config';

export default function LoginModal({ onClose, onSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { KEYCLOAK_URL, REALM, CLIENT_ID } = getAuthConfig();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const body = new URLSearchParams({
            grant_type: 'password',
            client_id: CLIENT_ID,
            username,
            password,
        });

        try {
            const res = await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body,
            });

            if (!res.ok) {
                const text = await res.text();
                const msg = text.includes('invalid_grant') ? 'Неверный логин или пароль' : 'Ошибка сервера';
                throw new Error(msg);
            }

            const data = await res.json();
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            localStorage.setItem('token_expires_at', Date.now() + data.expires_in * 1000);
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 className="modal-title">Вход в систему</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Логин</label>
                        <input
                            required
                            className="form-control"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="Введите логин"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Пароль</label>
                        <input
                            required
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Введите пароль"
                        />
                    </div>

                    {error && <p className="error-text">{error}</p>}

                    <div className="modal-actions">
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? 'Входим...' : 'Войти'}
                        </button>
                        <button type="button" onClick={onClose} disabled={loading} className="btn btn-outline">
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}