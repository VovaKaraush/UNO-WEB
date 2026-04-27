// Aucun import ici — les fonctions utilitaires sont injectées via init()
// pour éviter la dépendance circulaire avec actions.js

let _drawCard, _nextTurn, _getNextPlayer;

export function init({ drawCard, nextTurn, getNextPlayer }) {
  _drawCard = drawCard;
  _nextTurn = nextTurn;
  _getNextPlayer = getNextPlayer;
}

export function skip(game) {
  _nextTurn(game); // saute le joueur suivant
  _nextTurn(game);
}

export function reverse(game) {
  game.order = -game.order;
  if (game.players.length === 2) {
    // À 2 joueurs, reverse agit comme un skip
    _nextTurn(game);
    _nextTurn(game);
  } else {
    _nextTurn(game);
  }
}

export function draw2(game) {
  _drawCard(2, _getNextPlayer(game), game);
  _nextTurn(game); // saute le joueur suivant
  _nextTurn(game);
}

export function wild(game) {
  // La couleur est choisie côté client, on met le jeu en attente
  game.pending = "wild";
  _nextTurn(game);
}

export function draw4(game) {
  _drawCard(4, _getNextPlayer(game), game);
  game.pending = "wild";
  _nextTurn(game); // saute le joueur suivant
  _nextTurn(game);
}
