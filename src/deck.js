export function createDeck() {
  const colors = ["red", "green", "blue", "yellow"];
  const values = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "skip",
    "reverse",
    "draw2",
  ];

  let deck = [];

  for (let color of colors) {
    for (let value of values) {
      deck.push({ color, value }); //add the card
      if (value !== "0") {
        //if not 0 add it once again
        deck.push({ color, value });
      }
    }
  }
  
  // Add wild and draw4 cards with black/wild color (no specific color)
  for (let i = 0; i < 4; i++) {
    deck.push({ color: "black", value: "wild" });
    deck.push({ color: "black", value: "draw4" });
  }

  return deck;
}
