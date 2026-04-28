import path from 'path';
import express from 'express';
import setupPostRoutes from './post.js';

function setupRoutes(app) {
    // Initialize POST routes
    setupPostRoutes(app);

    // Get the Home Page
    app.get('/', (req, res) => {
        console.log("Root requested");
        res.sendFile(path.join(process.cwd(), 'public', 'login', 'login.html'));
    });

    // Homepage
    app.get('/homepage', (req, res) => {
        console.log("Homepage requested");
        res.sendFile(path.join(process.cwd(), 'public', 'acceuil', 'index.html'));
    });

    // Lobby
    app.get('/lobby', (req, res) => {
        console.log("Lobby requested");
        res.sendFile(path.join(process.cwd(), 'public', 'online', 'online.html'));
    });

    // Catch all
    app.use((req, res) => {
        console.log("Unknown route requested");
        res.status(404).send('404 - Page not found');
    });
}

export default setupRoutes;