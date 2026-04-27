export function createDeck() {
  const colors = ["red", "green", "blue", "yellow"];
  const values = [
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "skip", "reverse", "draw2",
  ];

  let deck = [];

  for (let color of colors) {
    for (let value of values) {
      deck.push({ color, value });
      if (value !== "0") {
        deck.push({ color, value });
      }
    }
  }

  // 4 wild + 4 draw4, sans couleur
  for (let i = 0; i < 4; i++) {
    deck.push({ color: "wild", value: "wild" });
    deck.push({ color: "wild", value: "draw4" });
  }

  return deck;
}
