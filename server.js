const express = require('express');
const jwt = require('jwt')
const path = require('path');
const setupRoutes = require('./script/routage.js');
const app = express();
const port = 3000;

app.use(express.json());

// Initialize routes
setupRoutes(app);

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
});