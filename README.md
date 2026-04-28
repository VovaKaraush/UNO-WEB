# 🎮 UNO-WEB

Une implémentation web du jeu classique UNO avec support multijoueur en réseau local.

## 📋 Table des matières

- [Description](#description)
- [Fonctionnalités](#fonctionnalités)
- [Structure du projet](#structure-du-projet)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Architecture](#architecture)
- [Technologies](#technologies)

---

## Description

**UNO-WEB** est une application web qui reproduit fidèlement le jeu de cartes UNO. Le projet propose un backend robuste en JavaScript gérant :

- ✅ Authentification utilisateur sécurisée
- ✅ Gestion des sessions avec tokens
- ✅ Moteur de jeu complet et fonctionnel
- ✅ Mode multijoueur local en LAN

## Fonctionnalités

- 🔐 **Authentification sécurisée** : Connexion utilisateur avec gestion de tokens
- 🎲 **Moteur de jeu complet** : Règles UNO entièrement implémentées
- 👥 **Multijoueur LAN** : Jeu en réseau local avec plusieurs joueurs
- 🎯 **Interface interactive** : Interface utilisateur intuitive et responsive
- 💾 **Gestion d'état** : Système de sauvegarde et synchronisation du jeu

## Structure du projet

```
UNO-WEB/
├── server.js                 # Serveur principal
├── package.json              # Dépendances du projet
├── db/
│   ├── database.js          # Configuration de la base de données
│   ├── post.js              # Opérations POST
│   └── routes.js            # Définition des routes
├── functions/
│   └── [Fonctions utilitaires]
├── public/                   # Ressources statiques
│   ├── client.js            # Code client JavaScript
│   ├── Acceuil/             # Page d'accueil
│   ├── Game/                # Interface du jeu
│   ├── Login/               # Page de connexion
│   └── Online/              # Mode online
└── src/                      # Logique métier
    ├── actions.js           # Actions du jeu
    ├── deck.js              # Gestion du paquet de cartes
    ├── game.js              # Moteur du jeu
    ├── player.js            # Gestion des joueurs
    ├── rule.js              # Règles du jeu
    ├── shuffle.js           # Mélange des cartes
    └── specialCards.js      # Cartes spéciales
```

## Installation

### Prérequis

- Node.js (v14 ou supérieur)
- npm

### Étapes

1. **Cloner le repository**
   ```bash
   git clone https://github.com/VovaKaraush/UNO-WEB.git
   cd UNO-WEB
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Lancer le serveur**
   ```bash
   npm start
   # ou
   node server.js
   ```

4. **Accéder à l'application**
   - Ouvrez votre navigateur et allez sur `http://localhost:3000`

## Utilisation

### Démarrer une partie

1. **Se connecter** : Accédez à la page de connexion et authentifiez-vous
2. **Créer ou rejoindre une partie** : Choisissez entre créer une nouvelle partie ou rejoindre une existante
3. **Jouer** : Suivez les règles du UNO classique

### Modes disponibles

- 🏠 **Accueil** : Page d'introduction et navigation
- 🌐 **Online** : Jouer en réseau local (LAN)

## Architecture

### Backend

- **Serveur** : Express.js (ou framework utilisé)
- **Authentification** : Système de tokens sécurisé
- **Base de données** : Gestion des utilisateurs et sessions
- **WebSocket** : Synchronisation temps réel des parties

### Frontend

- **Rendu** : HTML/CSS/JavaScript vanilla
- **Communication** : Requêtes WebSocket
- **État** : Gestion client du jeu

### Logique métier

- **Moteur de jeu** (`game.js`) : Boucle principale du jeu
- **Gestionnaire de joueurs** (`player.js`) : Profils et scores
- **Système de cartes** (`deck.js`, `specialCards.js`) : Gestion du paquet
- **Règles** (`rule.js`, `actions.js`) : Validation des coups

## Technologies

- **Backend** : Node.js, Express.js
- **Frontend** : HTML5, CSS3, JavaScript
- **Temps réel** : Socket.io
- **Base de données** : better-sqlite3
- **Authentification** : Tokens JWT 
---

## 📝 Notes

Pour toute question ou amélioration, n'hésitez pas à ouvrir une issue ou une pull request.

**Derniere mise à jour** : Avril 2026
