export function isPlayable(player_card, current_card, game) {
  // Wild and draw4 cards (black color) can always be played
  if (player_card.color === "black") {
    return true;
  }
  
  // If a wild color has been chosen, match that color
  if (game.wild_color && game.wild_color !== "") {
    if (player_card.color === game.wild_color) {
      return true;
    }
  }
  
  // Otherwise, match color or value
  return (
    player_card.color === current_card.color ||
    player_card.value === current_card.value
  );
}
