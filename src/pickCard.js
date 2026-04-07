// pickCard function : take's a card form the Draw_Pile and add it to player's hand
function pickCard(player, card) {
    // we don't need to check if the card is in the Draw_Pile because the game will not display any other cards that is in the Draw_Pile

    // we add the card to the player's hand and remove it from the Draw_Pile
    player.hand.push(card)
    table[1].top = {} // we can also remove the card from the Draw_Pile but it's not necessary because the game will not display any other cards that is in the Draw_Pile
}