let config = {
    API_BASE_URL: 'http://localhost:8091',
    TEMPLATES_LIST_URL: '/api/templates',
    TEMPLATES_CREATE_URL: '/api/templates',
    FILES_BASE_URL: '/files'
};

export const loadConfig = async () => {
    try {
        const res = await fetch('/config.json', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            config = { ...config, ...data };
            console.log('Config loaded:', config);
        }
    } catch (err) {
        console.error('Failed to load config.json:', err);
    }
};

export const getConfig = () => config;