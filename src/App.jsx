import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import PublicContent from './components/PublicContent';
import TemplateDetail from './components/TemplateDetail';
import UserApplications from './components/UserApplications'; // Новый компонент
import UserOrders from './components/UserOrders';
import Footer from './components/Footer';
import { getAuthConfig } from './auth-config';
import AdminDashboard from './components/AdminDashboard';
import UserOrdersAdmin from './components/UserOrdersAdmin';
import CreateApplication from './components/CreateApplication';
import OrderDetailAdmin from './components/OrderDetailAdmin';

export default function App() {
    const [token, setToken] = useState(localStorage.getItem('access_token'));

    useEffect(() => {
        const refreshToken = async () => {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) return;

            const { KEYCLOAK_URL, REALM, CLIENT_ID } = getAuthConfig();
            const expiresAt = localStorage.getItem('token_expires_at');

            if (expiresAt && Date.now() > parseInt(expiresAt) - 60000) {
                const body = new URLSearchParams({
                    grant_type: 'refresh_token',
                    client_id: CLIENT_ID,
                    refresh_token: refreshToken,
                });

                try {
                    const res = await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body,
                    });

                    if (res.ok) {
                        const data = await res.json();
                        localStorage.setItem('access_token', data.access_token);
                        localStorage.setItem('refresh_token', data.refresh_token);
                        localStorage.setItem('token_expires_at', Date.now() + data.expires_in * 1000);
                        setToken(data.access_token);
                    } else {
                        console.warn('Token refresh failed');
                        localStorage.clear();
                        setToken(null);
                    }
                } catch (err) {
                    console.error('Refresh error:', err);
                }
            }
        };

        refreshToken();
        const interval = setInterval(refreshToken, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <BrowserRouter>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh'
            }}>
                <Header token={token} setToken={setToken} />
                <main style={{
                    flex: 1,
                    width: '100%'
                }}>
                    <Routes>
                        <Route path="/" element={<PublicContent token={token} />} />
                        <Route
                            path="/template/:id"
                            element={
                                <TemplateDetail
                                    token={token}
                                    setToken={setToken}
                                />
                            }
                        />
                        <Route
                            path="/profile/applications"
                            element={<UserApplications token={token} />}
                        />
                        <Route
                            path="/profile/orders"
                            element={<UserApplications token={token} />}
                        />
                        {/* Новые маршруты для администратора */}
                        <Route
                            path="/admin"
                            element={<AdminDashboard token={token} />}
                        />
                        <Route
                            path="/admin/orders/:userId"
                            element={<UserOrdersAdmin token={token} />}
                        />
                        <Route
                            path="/admin/user/:userId/create-application"
                            element={<CreateApplication token={token} />}
                        />
                        <Route
                            path="/admin/order/:orderId"
                            element={<OrderDetailAdmin token={token} />}
                        />
                    </Routes>
                </main>
                <Footer />
            </div>
        </BrowserRouter>
    );
}