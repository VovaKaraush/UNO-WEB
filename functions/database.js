const Database = require('better-sqlite3');

const db = new Database('./db/users.db');


function startdb() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            password TEXT UNIQUE NOT NULL
        )
    `)
};

module.exports = startdb;