// uno cards (array of strings)
const cards = [
    {
        color: "red",
        value: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "Skip", "Reverse", "Draw_Two", "Draw_Four", "Wild"]
    },
    {
        color: "blue",
        value: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "Skip", "Reverse", "Draw_Two", "Draw_Four", "Wild"]
    },
    {
        color: "green",
        value: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "Skip", "Reverse", "Draw_Two", "Draw_Four", "Wild"]
    },
    {
        color: "yellow",
        value: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "Skip", "Reverse", "Draw_Two", "Draw_Four", "Wild"]
    }]

// players
const players = [
    {
        name: "Player_1",
        hand: []
    },
    {
        name: "Player_2",
        hand: []
    }
]

// table
const table = [
    {
        name: "Discard_Pile",
        top: {} // exemple : { color: "red", value: "4"}
    },
    {
        name: "Draw_Pile",
        top: {}
    }
]