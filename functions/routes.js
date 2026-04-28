const path = require('path');
const express = require('express');
const setupPostRoutes = require('./post.js');
const app = express();

app.use(express.static(path.join(__dirname, 'public)')));

function setupRoutes(app) {
    // Initialize POST routes
    setupPostRoutes(app);

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
    
    // Catch all other routes
    app.all('/{*any}', (req, res) => {
        console.log("unknown requested");
        res.status(404).send('404 - Page not found');
    });
}

module.exports = setupRoutes;