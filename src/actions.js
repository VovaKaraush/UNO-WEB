import { shuffle } from "./shuffle.js";
import * as specialCards from "./specialCards.js";

// Injection des utilitaires dans specialCards pour éviter la dépendance circulaire
specialCards.init({ drawCard, nextTurn, getNextPlayer });

// Pioche des cartes pour un joueur
export function drawCard(amount, player, game) {
  for (let i = 0; i < amount; i++) {
    // Si le deck est vide, on recycle la défausse (sauf la carte du dessus)
    if (game.deck.length === 0) {
      const top = game.discard.pop();
      game.deck = shuffle(game.discard);
      game.discard = [top];
    }
    if (game.deck.length > 0) {
      player.hand.push(game.deck.pop());
    }
  }
}

// Passer au joueur suivant
export function nextTurn(game) {
  game.wild_color = "";
  game.current_player += game.order;

  if (game.current_player >= game.players.length) {
    game.current_player = 0;
  } else if (game.current_player < 0) {
    game.current_player = game.players.length - 1;
  }
}

// Utilitaire : retourne le prochain joueur sans modifier l'état
export function getNextPlayer(game) {
  let idx = game.current_player + game.order;
  if (idx >= game.players.length) idx = 0;
  if (idx < 0) idx = game.players.length - 1;
  return game.players[idx];
}

// Jouer une carte
export function playCard(card_index, player, game) {
  const card = player.hand[card_index];
  if (!card) return { error: "Carte invalide" };

  player.hand.splice(card_index, 1);
  game.discard.push(card);
  game.wild_color = "";

  // Vérifier victoire
  if (player.hand.length === 0) {
    game.winner = player.name;
    return { ok: true };
  }

  // UNO automatique (1 carte restante)
  player.uno = player.hand.length === 1;

  // Déléguer l'effet à specialCards
  const effect = specialCards[card.value];
  if (effect) {
    effect(game);
  } else {
    nextTurn(game);
  }

  return { ok: true };
}
