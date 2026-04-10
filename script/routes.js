const path = require('path');

function setupRoutes(app) {
    // Get the Home Page
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'html', 'home.html'));
    });

    // Sends the lobby page
    app.get('/lobby', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'html', 'lobby.html'));
    });

    // Catch all other routes
    app.all('/{*any}', (req, res) => {
        res.status(404).send('404 - Page not found');
    });
}

module.exports = setupRoutes;