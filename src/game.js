import { createDeck } from "./deck.js";
import { createPlayers } from "./player.js";
import { shuffle } from "./shuffle.js";

export function createGame(playerNames) {
  const deck = shuffle(createDeck());
  const players = createPlayers(playerNames);

  // Distribuer 7 cartes à chaque joueur
  for (let i = 0; i < 7; i++) {
    for (let player of players) {
      player.hand.push(deck.pop());
    }
  }

  // Retourner la première carte (non spéciale pour commencer)
  let firstCard;
  do {
    firstCard = deck.pop();
    if (firstCard.color === "wild") {
      deck.unshift(firstCard); // remettre en bas
      firstCard = null;
    }
  } while (!firstCard);

  return {
    deck,
    discard: [firstCard],
    players,
    current_player: 0,
    order: 1,
    wild_color: "",
    // null = pas d'attente, "wild" = choisir couleur, "uno" = annonce UNO
    pending: null,
    winner: null,
  };
}
