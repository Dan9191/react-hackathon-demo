let config = {
    API_BASE_URL: '',
    TEMPLATES_LIST_URL: '',
    TEMPLATES_CREATE_URL: '',
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