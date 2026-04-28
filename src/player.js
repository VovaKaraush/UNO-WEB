export function createPlayers(players) {
  let list_players = [];

  for (let player of players) {
    list_players.push({
      name: player,
      hand: [],
      uno: false,
    });
  }

  return list_players;
}
