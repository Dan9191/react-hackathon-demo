let authConfig = {
    KEYCLOAK_URL: 'http://localhost:9090/',
    REALM: 'hackathon',
    CLIENT_ID: 'react-app'
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