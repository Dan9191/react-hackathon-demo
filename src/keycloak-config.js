let keycloakConfig = {
    url: 'http://localhost:9090/',
    realm: 'hackathon',
    clientId: 'react-app'
};

export const loadKeycloakConfig = async () => {
    try {
        const res = await fetch('/keycloak.json', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            keycloakConfig = { ...keycloakConfig, ...data };
            console.log('Keycloak config loaded:', keycloakConfig);
        } else {
            console.warn('keycloak.json not found, using defaults');
        }
    } catch (err) {
        console.error('Failed to load keycloak.json:', err);
    }
};

export const getKeycloakConfig = () => keycloakConfig;