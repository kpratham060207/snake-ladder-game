/*
 * game-core.js — the pure "rules of the game" module.
 *
 * This file deliberately contains NO browser code (no document, no window).
 * Keeping the rules separate from the screen drawing means:
 *   1. The rules can be tested automatically (see game-core.test.js).
 *   2. The same rules could be reused by a different interface later.
 *
 * Every function here is a "pure function": give it the same input and it
 * always returns the same output, without changing anything outside itself.
 * (rollDie is the one exception, since randomness is its whole job.)
 */

// The final square. A player must land on this EXACT number to win.
export const WINNING_SQUARE = 100;

/*
 * The board shortcuts, written as { landingSquare: destinationSquare }.
 * Example: 3 -> 27 means "a player who lands on 3 climbs up to 27".
 * Object.freeze prevents accidental edits to these boards while the game runs.
 */
export const LADDERS = Object.freeze({
  3: 27,
  8: 30,
  28: 84,
  51: 67,
  71: 99,
  80: 99,
});

// The board traps, written as { headSquare: tailSquare }.
// Example: 32 -> 10 means "a player who lands on 32 slides back down to 10".
export const SNAKES = Object.freeze({
  32: 10,
  36: 6,
  48: 26,
  88: 24,
  95: 56,
});

/*
 * Works out what happens when a player at `position` rolls `roll`.
 *
 * Inputs:
 *   position — the square the player is standing on right now (0 = not yet on
 *              the board, since players start off-board before their first roll)
 *   roll     — the dice value, 1 to 6
 *
 * Returns an object describing the whole move:
 *   position — where the player ENDS UP after any snake or ladder applies
 *   landedOn — the square the dice alone took them to, BEFORE the snake/ladder.
 *              The interface needs both so it can animate the walk to the
 *              square first, and then the climb or slide as a second step.
 *   effect   — "ladder", "snake", "overshoot", or null for an ordinary move
 *   won      — true only when the player finished exactly on square 100
 */
export function resolveMove(position, roll) {
  // Guard clauses: fail loudly on impossible input instead of silently
  // producing a nonsense board position that would be hard to debug later.
  if (!Number.isInteger(position) || position < 0 || position > WINNING_SQUARE) {
    throw new RangeError("Position must be an integer from 0 to 100.");
  }
  if (!Number.isInteger(roll) || roll < 1 || roll > 6) {
    throw new RangeError("Roll must be an integer from 1 to 6.");
  }

  /*
   * Rule: you must land on 100 exactly. A roll that would take you past it is
   * wasted and the player stays put. (The original C++ version added the roll
   * and then subtracted it again, which produced the same result in a much
   * more roundabout way.)
   */
  if (position + roll > WINNING_SQUARE) {
    return {
      position,
      landedOn: position,
      effect: "overshoot",
      won: false,
    };
  }

  const landedOn = position + roll;

  // Object.hasOwn is used instead of a plain truthiness check so that a
  // destination square of 0 would still be detected correctly.
  if (Object.hasOwn(LADDERS, landedOn)) {
    return {
      position: LADDERS[landedOn],
      landedOn,
      effect: "ladder",
      won: false,
    };
  }

  if (Object.hasOwn(SNAKES, landedOn)) {
    return {
      position: SNAKES[landedOn],
      landedOn,
      effect: "snake",
      won: false,
    };
  }

  // An ordinary move with no snake or ladder involved.
  return {
    position: landedOn,
    landedOn,
    effect: null,
    won: landedOn === WINNING_SQUARE,
  };
}

/*
 * Converts a square number (1-100) into an x/y point on the board.
 *
 * A Snake & Ladder board "snakes" back and forth (this is called a boustrophedon
 * or serpentine layout): square 1 is bottom-left, the numbers run right to 10,
 * then row 2 runs right-to-LEFT from 11 to 20, and so on up to 100 at top-left.
 *
 * The returned coordinates use a 1000x1000 grid so they can be dropped straight
 * into the SVG overlay that draws the snakes and ladders. Each cell is 100
 * units wide, and the +0.5 puts the point in the middle of the cell.
 */
export function boardCoordinate(square) {
  if (!Number.isInteger(square) || square < 1 || square > WINNING_SQUARE) {
    throw new RangeError("Square must be an integer from 1 to 100.");
  }

  // Which row the square sits in, counting up from the bottom (0-9).
  const rowFromBottom = Math.floor((square - 1) / 10);
  // How far along that row the square is, before direction is considered (0-9).
  const indexInRow = (square - 1) % 10;

  // Even rows (1-10, 21-30, ...) run left to right; odd rows run right to left.
  const column = rowFromBottom % 2 === 0 ? indexInRow : 9 - indexInRow;

  return {
    x: (column + 0.5) * 100,
    // y is flipped because SVG measures downwards from the top, while the board
    // numbers count upwards from the bottom.
    y: (9 - rowFromBottom + 0.5) * 100,
  };
}

/*
 * Rolls a six-sided dice and returns 1-6.
 *
 * The `random` parameter defaults to Math.random for real play, but a test can
 * pass in its own function to force a predictable "roll" and check the maths.
 */
export function rollDie(random = Math.random) {
  return Math.floor(random() * 6) + 1;
}
