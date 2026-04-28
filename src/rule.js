export function isPlayable(player_card, current_card, game) {
  return (
    player_card.color === current_card.color ||
    player_card.value === current_card.value ||
    player_card.color === "black" ||
    player_card.color === "wild" ||
    player_card.color === game.wild_color
  );
}
