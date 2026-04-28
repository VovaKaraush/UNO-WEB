import * as specialCards from "./specialCards.js";

export function playCard(card_index, player, game) {
  const special_cards = {
    skip: specialCards.skip,
    reverse: specialCards.reverse,
    draw2: specialCards.draw2,
    wild: specialCards.wild,
    draw4: specialCards.draw4,
  };

  // splice retourne un tableau → prendre [0]
  const card = player.hand.splice(card_index, 1)[0];

  game.discard.push(card);

  // Utiliser Object.keys() et accéder via crochet
  if (Object.keys(special_cards).includes(card.value)) {
    special_cards[card.value](game);
  }
}

export function drawCard(amount, player, game) {
  for (let i = 0; i < amount; i++) {
    if (game.deck.length === 0) {
      // Recycler la défausse si le deck est vide
      const top = game.discard.pop();
      game.deck = game.discard.sort(() => Math.random() - 0.5);
      game.discard = top ? [top] : [];
    }
    player.hand.push(game.deck.pop());
  }
}

export function nextTurn(game) {
  game.current_player += game.order;

  // length est une propriété, pas une méthode ; === et non =
  if (game.current_player >= game.players.length) {
    game.current_player = 0;
  } else if (game.current_player < 0) {
    game.current_player = game.players.length - 1;
  }
}
