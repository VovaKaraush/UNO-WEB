import * as actions from "./actions.js";
import { prompt } from "prompt-sync";

//#####################################################################################
//#                                                                                   #
//# For all functions below : "game" param is the whole game stats contained in a tab #
//#                                                                                   #
//#####################################################################################

export function skip(game) {
  //skip a turn by calling nextTurn function from "./actions.js"
  actions.nextTurn(game);
}

export function reverse(game) {
  //reverse the order by changing the sign of game.order (+1 = right; -1 = left)
  game.order = -game.order;
}

export function draw2(game) {
  //call the function drawCard(<card amount>, <next player based on current+1>, <game stats>)
  actions.drawCard(2, game.players[game.current_player++], game);
}

export function wild(game) {
  //declares a temporary input which will contain one of the 4 strings between ["red", "gree", "blue", "yellow"]
  let input = "";
  while (!["red", "gree", "blue", "yellow"].includes(input)) {
    input = prompt("Chose a color : ").toLowerCase();
  }
  game.wild_color = input;
}

export function draw4(game) {
  //call the function drawCard(<card amount>, <next player based on current+1>, <game stats>)
  actions.drawCard(4, game.players[game.current_player++], game);
  wild(game);
}
