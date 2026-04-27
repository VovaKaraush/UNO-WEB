const express = require('express');
const jwt = require('jsonwebtoken')
const path = require('path');
const json = require ('json')
const setupRoutes = require('./functions/routes.js');
const app = express();
const port = 3000;

app.use(express.static('public'));

app.use(express.json());

// Initialize routes
setupRoutes(app);

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
});