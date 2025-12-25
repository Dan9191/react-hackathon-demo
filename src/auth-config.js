// src/auth-config.js
let authConfig = {
    KEYCLOAK_URL: '',
    REALM: '',
    CLIENT_ID: ''
};

let appConfig = {
    API_BASE_URL: ''
};

export const loadAuthConfig = async () => {
    try {
        const res = await fetch('/auth-config.json', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            authConfig = { ...authConfig, ...data };
            console.log('Auth config loaded:', authConfig);
        }
    } catch {
        console.warn('auth-config.json not found, using defaults');
    }
};

export const loadAppConfig = async () => {
    try {
        const res = await fetch('/config.json', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            appConfig = { ...appConfig, ...data };
            console.log('App config loaded:', appConfig);
        }
    } catch (err) {
        console.error('Failed to load config.json:', err);
    }
};

export const getAuthConfig = () => authConfig;
export const getConfig = () => appConfig;

// Функция для загрузки всех конфигураций
export const loadAllConfigs = async () => {
    await Promise.all([loadAuthConfig(), loadAppConfig()]);
};