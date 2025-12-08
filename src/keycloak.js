import Keycloak from 'keycloak-js';
import { getKeycloakConfig } from './keycloak-config';

let keycloakInstance = null;

export const initKeycloak = async () => {
    if (keycloakInstance) return keycloakInstance;

    const config = getKeycloakConfig();
    keycloakInstance = new Keycloak(config);

    await keycloakInstance.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        pkceMethod: 'S256',
        checkLoginIframe: false,
    });

    return keycloakInstance;
};

export const getKeycloak = () => keycloakInstance;