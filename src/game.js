import { createDeck } from "./deck.js";
import { createPlayers } from "./player.js";

export function createGame(players) {
  return {
    deck: createDeck().sort(() => Math.random() - 0.5),
    discard: [],
    players: createPlayers(players),
    current_player: 0,
    order: 1,
    wild_color: "",
  };
}
