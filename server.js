import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import { createGame } from "./src/game.js";
import { playCard, drawCard, nextTurn } from "./src/actions.js";
import { isPlayable } from "./src/rule.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static(join(__dirname, "public")));

// État global de la partie
let game = null;

// Construire la vue du jeu pour un joueur donné
// On ne lui envoie que sa propre main, les autres joueurs n'ont que le nombre de cartes
function buildStateFor(playerIndex) {
  if (!game) return null;

  const topCard = game.discard[game.discard.length - 1];

  return {
    players: game.players.map((p, i) => ({
      name: p.name,
      cardCount: p.hand.length,
      uno: p.uno,
      isCurrentPlayer: i === game.current_player,
      // La main complète uniquement pour ce joueur
      hand: i === playerIndex ? p.hand : null,
    })),
    current_player: game.current_player,
    topCard,
    wild_color: game.wild_color,
    pending: game.pending,
    winner: game.winner,
    deckCount: game.deck.length,
    // Cartes jouables pour ce joueur (si c'est son tour)
    playable:
      playerIndex === game.current_player && !game.pending && !game.winner
        ? game.players[playerIndex].hand.map((c) =>
            isPlayable(c, topCard, game)
          )
        : [],
  };
}

function broadcast() {
  if (!game) return;
  game.players.forEach((_, i) => {
    io.to(`player_${i}`).emit("state", buildStateFor(i));
  });
  // Spectateurs (écran commun)
  io.to("spectator").emit("state", buildStateFor(-1));
}

io.on("connection", (socket) => {
  console.log("Connexion :", socket.id);

  // Rejoindre en tant que joueur ou spectateur
  socket.on("join", ({ playerIndex }) => {
    if (typeof playerIndex === "number" && playerIndex >= 0) {
      socket.join(`player_${playerIndex}`);
      socket.data.playerIndex = playerIndex;
    } else {
      socket.join("spectator");
      socket.data.playerIndex = -1;
    }
    if (game) {
      socket.emit("state", buildStateFor(socket.data.playerIndex));
    }
  });

  // Lancer la partie
  socket.on("startGame", ({ playerNames }) => {
    if (!playerNames || playerNames.length < 2) {
      socket.emit("error", "Il faut au moins 2 joueurs.");
      return;
    }
    game = createGame(playerNames);
    io.emit("gameStarted", { playerCount: playerNames.length, playerNames });
    broadcast();
  });

  // Jouer une carte
  socket.on("playCard", ({ cardIndex }) => {
    const pi = socket.data.playerIndex;
    if (!game || game.winner) return;
    if (pi !== game.current_player) {
      socket.emit("error", "Ce n'est pas votre tour.");
      return;
    }
    if (game.pending) {
      socket.emit("error", "Action en attente (choix de couleur ?).");
      return;
    }

    const player = game.players[pi];
    const card = player.hand[cardIndex];
    const topCard = game.discard[game.discard.length - 1];

    if (!isPlayable(card, topCard, game)) {
      socket.emit("error", "Cette carte n'est pas jouable.");
      return;
    }

    const result = playCard(cardIndex, player, game);
    if (result.error) {
      socket.emit("error", result.error);
      return;
    }

    broadcast();
  });

  // Piocher une carte
  socket.on("drawCard", () => {
    const pi = socket.data.playerIndex;
    if (!game || game.winner) return;
    if (pi !== game.current_player) {
      socket.emit("error", "Ce n'est pas votre tour.");
      return;
    }
    if (game.pending) return;

    const player = game.players[pi];
    drawCard(1, player, game);

    // Vérifier si la carte piochée est jouable
    const drawn = player.hand[player.hand.length - 1];
    const topCard = game.discard[game.discard.length - 1];
    if (!isPlayable(drawn, topCard, game)) {
      // Pas jouable → on passe au suivant automatiquement
      nextTurn(game);
    }
    // Si jouable, le joueur peut choisir de la jouer (prochain playCard) ou de passer

    broadcast();
  });

  // Passer son tour après avoir pioché
  socket.on("passTurn", () => {
    const pi = socket.data.playerIndex;
    if (!game || game.winner) return;
    if (pi !== game.current_player) return;
    nextTurn(game);
    broadcast();
  });

  // Choisir la couleur après un wild
  socket.on("chooseColor", ({ color }) => {
    const pi = socket.data.playerIndex;
    if (!game) return;
    if (game.pending !== "wild") return;
    // C'est le joueur qui VIENT de jouer qui choisit (donc current_player est déjà le suivant)
    // On autorise le choix depuis n'importe quel socket pour simplifier
    const validColors = ["red", "green", "blue", "yellow"];
    if (!validColors.includes(color)) {
      socket.emit("error", "Couleur invalide.");
      return;
    }
    game.wild_color = color;
    game.pending = null;
    broadcast();
  });

  // Réinitialiser
  socket.on("resetGame", () => {
    game = null;
    io.emit("reset");
  });
});

server.listen(3000, () => {
  console.log("Serveur UNO lancé sur http://localhost:3000");
});
