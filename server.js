require('dotenv').config(); // Charge les variables d'environnement en premier
const express = require('express');
const jwt = require('jsonwebtoken')
const path = require('path');
const setupRoutes = require('./functions/routes.js');
const startdb = require('./functions/database.js')
const app = express();
const port = 3000;

app.use(express.static('public'));

app.use(express.json());

// Initialize routes
setupRoutes(app);
startdb();

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
});