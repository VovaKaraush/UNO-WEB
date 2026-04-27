const path = require('path');

function setupRoutes(app) {
    // Get the Home Page
    app.get('/', (req, res) => {
        console.log("Root requested");
        res.sendFile(path.join(__dirname, '..', 'public', 'login', 'login.html'));
    });

    //sends homepage
    app.get('/homepage', (req, res) => {
        console.log("Lobby requested");
        res.sendFile(path.join(__dirname, '..', 'public', 'acceuil', 'index.html'));
    });

    // Sends the lobby page
    app.get('/lobby', (req, res) => {
        console.log("Lobby requested");
        res.sendFile(path.join(__dirname, '..', 'public', 'online', 'online.html'));
    });

    // Post coming from the login page containing login data.
    app.post('/', (req, res) => {
        const { userId, email } = req.body;
        // Process the data
        res.json({ success: true });
    });

    // Catch all other routes
    app.all('/{*any}', (req, res) => {
        console.log("unknown requested");
        res.status(404).send('404 - Page not found');
    });
}

module.exports = setupRoutes;