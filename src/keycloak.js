import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    url: 'http://localhost:9090/',
    realm: 'hackathon',
    clientId: 'react-app',
});

export default keycloak;
