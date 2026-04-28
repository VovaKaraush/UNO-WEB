import * as specialCards from "./special_cards.js";

export function playCard(card_index, player, game) {
  const special_cards = {
    skip: specialCards.skip,
    reverse: specialCards.reverse,
    draw2: specialCards.draw2,
    wild: specialCards.wild,
    draw4: specialCards.draw4,
  };
  const card = player.hand.splice(card_index, 1);

  game.discard.push(card);

  if (special_cards.keys().includes(card.value)) {
    special_cards.value(game);
  }
}

export function drawCard(amount, player, game) {
  for (let i = 0; i < amount; i++) {
    player.hand.push(game.deck.pop());
  }
}

export function nextTurn(game) {
  game.current_player += game.order;

  if ((game.current_player = game.players.length())) {
    game.current_player = 0;
  } else if (game.current_player < 0) {
    game.current_player = game.players.length() - 1;
  }
}
