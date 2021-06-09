# Simply Roulette
A simple package to create and run roulette games.

## Example

```js
const Roulette = require('simply-roulette');

// Create a new Table
const Table = new Roulette({ logging: true });

// Add a Bet
// Params:  Player, Bet, Amount
Table.addBet('one', 'black', 110);

// View all bets
console.log('All Bets: ', Table.bets);

// Manually spin the table
const results = await Table.spin();
console.log('Manual Spin Results: ', results);

// Start the game to auto spin and produce events
Table.start();

// Event handler for every time the wheel spins automatically.
Table.on('spin', (results) => {
  console.log('Wheel Results:', results);
});
```
