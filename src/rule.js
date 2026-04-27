export function isPlayable(player_card, current_card, game) {
  const effectiveColor = game.wild_color || current_card.color;
  return (
    player_card.color === effectiveColor ||
    player_card.value === current_card.value ||
    player_card.color === "wild"
  );
}
