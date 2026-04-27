// server.js - The Backend
const express = require('express');
const fs = require('fs').promises
const path = require('path');
const { json } = require('stream/consumers');
const app = express();

// Middleware to parse JSON from requests
app.use(express.json());

// Serve our HTML page
app.use(express.static('public'));

// Fake database (in reality, you'd use a real database)
/*const users = [
  { username: 'alice', password: 'password123' }
];*/

app.get('/', (req, res) => {
  console.log("Root requested");
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// LOGIN ENDPOINT - This is where login requests come
app.post('/api/login', (req, res) => {

  console.log('📨 Backend login received:', req.body);
  
  const { username, password } = req.body;
  
  // Check if user exists
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    console.log('✅ Login successful!');
    res.json({ success: true, message: 'Welcome!' });
  } else {
    console.log('❌ Login failed!');
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/signup', (req, res) => {
  console.log('📨 Backend sign up received:', req.body);
  const { username, password } = req.body;
  const newUser = { username: username, password: password };
  if (users.some(u => u.username === username)){
    res.json({ success: false, message: 'This username is already taken, choose another one.'});
    console.log(users, '\n the list was not updated')
  } else {
    users.push(newUser);
    console.log('new user registered:', newUser);
    console.log(users);
    res.json({ success: true, message: 'User registered successfully!'});
  }
});

const JSON_FILE_PATH = path.join(__dirname, 'private', 'users.json');

// Will return true if the json is present, false if it is not
async function jsonCheck() {
  try {
    const data = await fs.readFile(JSON_FILE_PATH, 'utf8');
    if (JSON.parse(data)){
      return true;
    } else {
      return false;
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty array
      return false
    }
    throw error;
  };
};

async function createJson() {
  if (jsonCheck()){
    console.log('file was already created');
  } else {
    fs.writeFile("private/users.json", '{}', 'utf8');
  };
};

createJson();

app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});