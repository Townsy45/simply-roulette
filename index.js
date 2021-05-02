const nanoid = require('nanoid');
const { existsSync, writeFileSync } = require('fs');
const { join } = require('path');
// Prepare the database
const Database = require('better-sqlite3');
const DBPath = join(module.path, 'roulette.db');
// Create the database
const DB = new Database(DBPath);
// Create the table if not found
(async () => {
  if (!await DB.prepare('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'games\'').get()) await DB.prepare("CREATE TABLE games (id TEXT)").run();
})();


class SimplyRoulette {
  constructor(options = {}) {
    // Class Variables
    this.id = generateID(); // The ID of the game
    this.minimumBet = options.minimumBet || 1 ; // The smallest amount a player can bet
    this.maximumBet = options.minimumBet ||  10000; // The larges amount any player can bet
    this.numberOfBets = options.numberOfBets || 3; // The number of bets a single player can place per spin
    this.lastSpin = null; // The result of the last spin
    this.logging = boolCheck(options.logging) || false; // If they want logs from this module to display in the console (Includes warnings and errors)

    // Player data
    this.bets = []; // Example: [{ player: 'townsy', bet: 100, space: black-31 }]
    this.winners = [];
    this.totalBets = [];

    // Class Functions
    this.setMinimumBet = this.setMinimumBet.bind(this);
    this.setMaximumBet = this.setMaximumBet.bind(this);
  }

  setMinimumBet(bet) {
    // Return if not valid, not a string / number or less then 1
    if (!bet || !['string', 'number'].includes(typeof bet) || bet < 1) return this;
    this.minimumBet = typeof bet === 'string' ? Number(bet) : bet;
    return this;
  }

  setMaximumBet(bet) {
    // Return if not valid, not a string / number or more then 100,000,000
    if (!bet || !['string', 'number'].includes(typeof bet) || bet > 100000000) return this;
    this.maximumBet = typeof bet === 'string' ? Number(bet) : bet;
    return this;
  }

  spin() {
    const spot = getOutcome();
    // TODO add function here
  }

}

module.exports = SimplyRoulette;

function generateID(length = 10) {
  return nanoid.customAlphabet('abcdefghijklmnopqrstuvwxyz1234567890', length)();
  /* TODO :
      Try adding this at some point, having issues with await and the constructor,
      the id is not available instantly.
    const _id = nanoid.customAlphabet('abcdefghijklmnopqrstuvwxyz1234567890', length)();
    const res = await DB.get('SELECT id FROM games WHERE id = ?', [_id]);
    console.log('RES', res);
    if (res) return generateID(length);
    await DB.run('INSERT INTO games (id) VALUES (?)', [_id]);
    return _id;
  */
}

function boolCheck(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string' && value.toLowerCase().match(/^(true|false)$/g)) return Boolean(value);
}

function getOutcome() {
  const spaces = [
    { number: 1, colour: "red" },
    { number: 2, colour: "black" },
    { number: 3, colour: "red" },
    { number: 4, colour: "black" },
    { number: 5, colour: "red" },
    { number: 6, colour: "black" },
    { number: 7, colour: "red" },
    { number: 8, colour: "black" },
    { number: 9, colour: "red" },
    { number: 10, colour: "black" },
    { number: 11, colour: "black" },
    { number: 12, colour: "red" },
    { number: 13, colour: "black" },
    { number: 14, colour: "red" },
    { number: 15, colour: "black" },
    { number: 16, colour: "red" },
    { number: 17, colour: "black" },
    { number: 18, colour: "red" },
    { number: 19, colour: "red" },
    { number: 20, colour: "black" },
    { number: 21, colour: "red" },
    { number: 22, colour: "black" },
    { number: 23, colour: "red" },
    { number: 24, colour: "black" },
    { number: 25, colour: "red" },
    { number: 26, colour: "black" },
    { number: 27, colour: "red" },
    { number: 28, colour: "black" },
    { number: 29, colour: "black" },
    { number: 30, colour: "red" },
    { number: 31, colour: "black" },
    { number: 32, colour: "red" },
    { number: 33, colour: "black" },
    { number: 34, colour: "red" },
    { number: 35, colour: "black" },
    { number: 36, colour: "red" }
  ];
  return spaces[Math.floor(Math.random() * spaces.length)];
}
