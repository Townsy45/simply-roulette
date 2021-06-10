# Simply Roulette
A simple package to create and run roulette games.

## Example Usage

```js
const Roulette = require('simply-roulette');

// Create a new Table
const Table = new Roulette({ logging: true });

// Add Bets
// Params:  Player, Bet, Amount
Table.addBet('one', 'black', 110);
Table.addBet('two', '12', 56);

// Start the game to auto spin and produce events
Table.startGame();

// Event handler for every time the wheel spins automatically.
Table.on('spin', (results) => {
  console.log('Wheel Results:', results);
});
```

## Handling Betting

```js
// Send options when creating the Table
const Table = new Roulette({
  minimumBet: 100, // Default: 1
  maximumBet: 5000, // Default: 10000
// Max number of a bets a single player can make
  numberOfBets: 5 // Default: 3
});

// Add a Player Bet
Table.addBet('one', '30', 160);

// Edit Min/Max After the fact
Table.setMiniumBet(10);
Table.setMaxiumBet(10000);

// List All Bets
const allBets = Table.bets();
```

## Handling The Table

```js
// Creating a Table
const Table = new Roulette();

// Manually Spin
Table.spin()
  .then(results => {
    console.log('RESULTS', results);
  });

// Start an Auto-Spin (Spin's every minute)
Table.startGame();

// Handling Auto Spins
Table.on('spin', (results) => {
  console.log('RESULTS', results);
});

// Stop the Auto-Spin
Table.stopGame();
```
