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
// Handle the jobs (Wheel cron jobs)
const { EventEmitter } = require('events');
const cron = require('node-cron');
const wheels = {};


class SimplyRoulette extends EventEmitter {
  constructor(options = {}) {
    super();
    // Class Variables
    this.id = generateID(); // The ID of the game
    this.minimumBet = options.minimumBet || 1 ; // The smallest amount a player can bet
    this.maximumBet = options.minimumBet ||  10000; // The larges amount any player can bet
    this.numberOfBets = options.numberOfBets || 3; // The number of bets a single player can place per spin
    this.lastSpin = null; // The result of the last spin
    this.logging = boolCheck(options.logging) || false; // If they want logs from this module to display in the console (Includes warnings and errors)

    // Player data
    this.bets = []; // Example: [{ player: 'townsy', amount: 100, bet: black }]
    this.winners = [];

    // Class Functions
    this.setNumberOfBets = this.setNumberOfBets.bind(this);
    this.setMinimumBet = this.setMinimumBet.bind(this);
    this.setMaximumBet = this.setMaximumBet.bind(this);
    this.startGame = this.startGame.bind(this);
    this.stopGame = this.stopGame.bind(this);
    this.addBet = this.addBet.bind(this);
    this.spin = this.spin.bind(this);
  }

  setMinimumBet(bet) {
    // Return if not valid, not a string / number or less then 1
    if (!bet || !['string', 'number'].includes(typeof bet) || bet < 1) return this;
    if (typeof bet === 'string' && isNaN(bet)) return this; // Return if not a number string
    this.minimumBet = typeof bet === 'string' ? Number(bet) : bet;
    return this;
  }

  setMaximumBet(bet) {
    // Return if not valid, not a string / number or more then 100,000,000
    if (!bet || !['string', 'number'].includes(typeof bet) || bet > 100000000) return this;
    if (typeof bet === 'string' && isNaN(bet)) return this; // Return if not a number string
    this.maximumBet = typeof bet === 'string' ? Number(bet) : bet;
    return this;
  }

  setNumberOfBets(amt) {
    // Return if the amount is invalid
    if (!amt || !['string', 'number'].includes(typeof amt) || amt === this.numberOfBets) return this;
    if (typeof amt === 'string' && isNaN(amt)) return this; // Return if not a number string
    this.numberOfBets = typeof amt === 'string' ? Number(amt) : amt;
    return this;
  }

  startGame() {
    // Start the auto game
    if (this.logging) console.log(`+++ Starting Auto-Game (${this.id}) +++`);
    if (wheels[this.id]) return;
    wheels[this.id] = cron.schedule('* */1 * * * *', async () => await this.spin(), null);
  }

  stopGame() {
    // Stop the game
    if (wheels[this.id]) {
      wheels[this.id].stop();
      delete wheels[this.id];
    }
  }

  addBet(player, bet, amount) {
    if (
      bet === undefined || bet === null ||
      amount === undefined || amount === null
    ) return 'Unable to set with an unknown bet or amount';
    const playerBets = this.bets.filter(b => b.player === player);
    if (playerBets.length >= 3 || !validBet(bet) || !validAmount(amount, this)) return;
    this.bets.push({ player, bet, amount });
    return 'success';
  }

  async spin() {
    const gameExists = await DB.prepare('SELECT id FROM games WHERE id = ?').get(this.id);
    if (!gameExists) await DB.prepare('INSERT INTO games (id) VALUES (?)').run(this.id);
    if (this.logging) console.log(`-----------------------\n(${this.id}) Spinning Wheel...`);
    const spot = await getOutcome();
    this.lastSpin = spot;
    this.winners = [];
    for (const { player, bet, amount } of this.bets) {
      if (
        spot.colour === bet
        || spot.number === parseInt(bet)
        || isDozen(spot.number, bet)
        || isOddEven(spot.number, bet) // Is even or odd
      ) {
        const odds = betOdds(player, bet, spot);
        const prize = parseInt(amount) * (odds ? parseInt(odds.split(':')[0]) : 1);
        this.winners.push({ player, bet: `Bet ${amount} on (${bet})`, prize });
      }
    }
    this.bets = [];
    const result = { spot, wins: this.winners };
    this.emit('spin', result);
    await DB.prepare('UPDATE games SET last_spin = ?, last_winners = ?, spin_count = spin_count + 1 WHERE id = ?')
      .run(JSON.stringify(spot), JSON.stringify(this.winners), this.id);
    if (this.logging) console.log(`(${this.id}) WINNERS: ${this.winners.length ? this.winners.map(w => `\n-> Player (${w.player}), ${w.bet} and won ${w.prize}`) : 'None!'}`);
    return result;
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
    { number: 0, colour: "green" },
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
  ].shuffle(6);
  return spaces[Math.floor(Math.random() * spaces.length)];
}

function betOdds(player, bet, spot) {
  /*
    Accepted Bets:
      black / red (Whole colours)
      even / odd (Even/odd numbers)
      0-36 (Single numbers)
      1-12 / 13-24 / 25-36 (Dozens)
      1-18 / 19-36 (High/Low end)
   */
  const odds = {
    black: '1:1', // Any black
    red: '1:1', // Any red
    oddEven: '1:1', // Any even or odd number that matches the bet
    highLow: '1:1', // Any number from 1-18 or 19-36
    dozen: '2:1', // The first dozen (1-12) second dozen (13-24) or third dozen (25-36)
    zero: '17:1', // The number 0 is winner
    straight: '35:1', // Single number bet
  };
  // Figure out what bet they have
  if (betType.number(bet)) return (spot.number === parseInt(bet) && spot.number < 1) ? odds.zero : odds.straight;
  if (betType.colour(bet)) return odds[bet];
  if (betType.dozen(bet)) return odds.dozen;
  if (betType.highLow(bet)) return odds.highLow;
  if (betType.oddEven(bet)) return odds.oddEven;

}

function validBet(b) {
  return (b
    && (betType.number(b) || betType.colour(b) || betType.dozen(b) || betType.highLow(b) || betType.oddEven(b))
  );
}

function validAmount(a, instance) {
  return (
    !['number', 'string'].includes(typeof a) || (typeof a === 'string' && isNaN(a))
      ? false
      : parseInt(a) <= instance.maximumBet && parseInt(a) >= instance.minimumBet);
}

const betType = {
  number(b) { return RegExp('^([0-9]|1[0-9]|2[0-9]|3[0-6])$').test(b) },
  dozen(b) { return RegExp('^(1-12|13-24|25-36)$').test(b) },
  highLow(b) { return RegExp('^(1-18|19-36)$').test(b) },
  oddEven(b) { return RegExp('^even|odd$').test(b) },
  colour(b) { return RegExp('^black|red$').test(b) },
}

function isDozen(s, b) {
  return betType.dozen(b) && (s >= parseInt(b.split('-')[0])) && (s <= parseInt(b.split('-')[1]));
}

function isOddEven(s, b) {
  return betType.oddEven(b) && (b === s % 2 ? 'odd' : 'even');
}

Array.prototype.shuffle = function (times) {
  if (typeof times !== 'number') times = 1;
  for (let i = 0; i < times; i++) {
    let currentIndex = this.length, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      // And swap it with the current element.
      [this[currentIndex], this[randomIndex]] = [this[randomIndex], this[currentIndex]];
    }
  }
  return this;
}
