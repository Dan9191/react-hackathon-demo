let authConfig = {
    KEYCLOAK_URL: '',
    REALM: '',
    CLIENT_ID: ''
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

export const getAuthConfig = () => authConfig;