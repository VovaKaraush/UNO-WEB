import { createDeck } from "./deck.js";
import { createPlayers } from "./player.js";

export function createGame(players) {
  const deck = createDeck().sort(() => Math.random() - 0.5);
  const playerList = createPlayers(players);

  // Distribuer 7 cartes à chaque joueur
  for (const player of playerList) {
    for (let i = 0; i < 7; i++) {
      player.hand.push(deck.pop());
    }
  }

  // Retourner la première carte de la défausse (éviter wild/draw4 comme première carte)
  let firstCard;
  do {
    firstCard = deck.pop();
    if (firstCard.value === 'wild' || firstCard.value === 'draw4') {
      deck.unshift(firstCard); // remettre au fond
      firstCard = null;
    }
  } while (!firstCard);

  return {
    deck,
    discard: [firstCard],
    players: playerList,
    current_player: 0,
    order: 1,
    wild_color: "",
    pending: "",
  };
}
