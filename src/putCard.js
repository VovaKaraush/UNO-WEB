// putCard function : takes a card and put it down on the pile
function putCard(player, card) {
    // we don't need to check if the card is in the player's hand because the game will not display any other cards that is in the player's hand

    // topcard is the last card in the discard pile, also a single value object with color and value properties
    const topCard = table[0].top
    if (card.color === topCard.color || card.value === topCard.value || card.value === "Wild" || card.value === "Draw_Four" || card.value === "Draw_Two") {
        // if the card is valid, we put it down on the discard pile and remove it from the player's hand
        table[0].top = card
        player.hand.splice(player.hand.indexOf(card), 1)
    }
}