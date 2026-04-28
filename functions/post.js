const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = new Database('./db/users.db');
// -------------------------------------token d'environement--------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
//--------------------------------laissé en prod pour facilités-----------------------------------------

function setupPostRoutes(app) {
    // POST Login route
    app.post('/api/login', (req, res) => {
        try {
            const { username, password } = req.body;

            // Validation
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Le pseudo et le mot de passe sont requis'
                });
            }

            // Check if user exists
            const user = db.prepare('SELECT * FROM users WHERE name = ?').get(username);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Pseudo ou mot de passe incorrect'
                });
            }

            // Check password
            const passwordMatch = bcrypt.compareSync(password, user.password);
            
            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Pseudo ou mot de passe incorrect'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { id: user.id, username: user.name, email: user.email },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                message: 'Connexion réussie',
                token: token,
                user: {
                    id: user.id,
                    username: user.name,
                    email: user.email
                }
            });

        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur serveur'
            });
        }
    });

    // POST Register route
    app.post('/api/register', (req, res) => {
        try {
            const { username, email, password, confirmPassword } = req.body;

            // Validation
            if (!username || !email || !password || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Tous les champs sont requis'
                });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Les mots de passe ne correspondent pas'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Le mot de passe doit contenir au moins 6 caractères'
                });
            }

            // Check if username already exists
            const existingUser = db.prepare('SELECT * FROM users WHERE name = ?').get(username);
            
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Ce pseudo est déjà utilisé'
                });
            }

            // Check if email already exists
            const existingEmail = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
            
            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    message: 'Cet email est déjà utilisé'
                });
            }

            // Hash password
            const hashedPassword = bcrypt.hashSync(password, 10);

            // Create user
            const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(username, email, hashedPassword);

            // Generate JWT token
            const token = jwt.sign(
                { id: result.lastInsertRowid, username: username, email: email },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                success: true,
                message: 'Compte créé avec succès',
                token: token,
                user: {
                    id: result.lastInsertRowid,
                    username: username,
                    email: email
                }
            });

        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur serveur'
            });
        }
    });
}

module.exports = setupPostRoutes;
