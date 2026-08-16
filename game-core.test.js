/*
 * game-core.test.js — automated checks for the game rules.
 *
 * These tests use a tiny hand-written test runner (below) instead of a testing
 * library, so they can run on ANY JavaScript engine without installing
 * anything. See the README for the exact command to run them.
 *
 * Each test states a rule of the game in plain English, then proves it.
 */

import {
  LADDERS,
  SNAKES,
  WINNING_SQUARE,
  boardCoordinate,
  resolveMove,
  rollDie,
} from "./game-core.js";

// ---------------------------------------------------------------------------
// A very small test runner
// ---------------------------------------------------------------------------

// Counters so we can print a summary and exit with a failure code if needed.
let passed = 0;
let failed = 0;

/*
 * Runs one named test. If the function throws, the test is recorded as a
 * failure and the error message is printed, but the remaining tests still run
 * so you can see every problem in one go.
 */
function test(name, testFunction) {
  try {
    testFunction();
    passed += 1;
    print(`  PASS  ${name}`);
  } catch (error) {
    failed += 1;
    print(`  FAIL  ${name}`);
    print(`        ${error.message}`);
  }
}

// Throws unless `actual` and `expected` are the same simple value.
function equal(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

// Compares two objects by turning them into JSON strings. This is enough here
// because every value we compare is a plain object of numbers and strings.
function deepEqual(actual, expected, label) {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);
  if (actualText !== expectedText) {
    throw new Error(`${label}: expected ${expectedText}, got ${actualText}`);
  }
}

// Throws unless the given function itself throws. Used to prove that invalid
// input is rejected rather than quietly accepted.
function throws(testFunction, label) {
  try {
    testFunction();
  } catch {
    return;
  }
  throw new Error(`${label}: expected an error, but none was thrown`);
}

// `print` exists in the JavaScriptCore shell but not in Node, so fall back to
// console.log when it is missing. This keeps the file runnable in both.
const print =
  typeof globalThis.print === "function"
    ? globalThis.print
    : (message) => console.log(message);

// ---------------------------------------------------------------------------
// The tests
// ---------------------------------------------------------------------------

print("Snake & Ladder rules");

test("an ordinary roll simply moves the player forward", () => {
  deepEqual(
    resolveMove(10, 4),
    { position: 14, landedOn: 14, effect: null, won: false },
    "10 + 4",
  );
});

test("landing on a ladder carries the player up", () => {
  // Standing on 1 and rolling 2 lands on square 3, which is a ladder to 27.
  deepEqual(
    resolveMove(1, 2),
    { position: 27, landedOn: 3, effect: "ladder", won: false },
    "ladder at 3",
  );
});

test("landing on a snake drags the player down", () => {
  // Standing on 30 and rolling 2 lands on square 32, a snake head down to 10.
  deepEqual(
    resolveMove(30, 2),
    { position: 10, landedOn: 32, effect: "snake", won: false },
    "snake at 32",
  );
});

test("a roll that overshoots 100 leaves the player where they were", () => {
  deepEqual(
    resolveMove(98, 4),
    { position: 98, landedOn: 98, effect: "overshoot", won: false },
    "98 + 4",
  );
});

test("landing exactly on 100 wins the game", () => {
  equal(resolveMove(96, 4).won, true, "96 + 4 should win");
});

test("reaching 99 is not yet a win", () => {
  equal(resolveMove(95, 4).won, false, "95 + 4 should not win");
});

test("every ladder goes up and every snake goes down", () => {
  for (const [from, to] of Object.entries(LADDERS)) {
    if (to <= Number(from)) {
      throw new Error(`ladder ${from} -> ${to} does not go up`);
    }
  }
  for (const [from, to] of Object.entries(SNAKES)) {
    if (to >= Number(from)) {
      throw new Error(`snake ${from} -> ${to} does not go down`);
    }
  }
});

test("no square is both a snake and a ladder", () => {
  for (const square of Object.keys(LADDERS)) {
    if (Object.hasOwn(SNAKES, square)) {
      throw new Error(`square ${square} is listed as both`);
    }
  }
});

test("the winning square is never a snake head", () => {
  equal(Object.hasOwn(SNAKES, WINNING_SQUARE), false, "snake on 100");
});

test("board coordinates follow the serpentine layout", () => {
  // Row 1 runs left to right along the bottom of the board.
  deepEqual(boardCoordinate(1), { x: 50, y: 950 }, "square 1");
  deepEqual(boardCoordinate(10), { x: 950, y: 950 }, "square 10");
  // Row 2 doubles back, so 11 sits directly above 10.
  deepEqual(boardCoordinate(11), { x: 950, y: 850 }, "square 11");
  deepEqual(boardCoordinate(20), { x: 50, y: 850 }, "square 20");
  // 100 finishes at the top left corner.
  deepEqual(boardCoordinate(100), { x: 50, y: 50 }, "square 100");
});

test("dice rolls always land between one and six", () => {
  // Feeding in the lowest and highest possible random values proves the
  // formula can never produce a 0 or a 7.
  equal(rollDie(() => 0), 1, "lowest roll");
  equal(rollDie(() => 0.999999), 6, "highest roll");
});

test("impossible positions and rolls are rejected", () => {
  throws(() => resolveMove(-1, 3), "negative position");
  throws(() => resolveMove(101, 3), "position past the board");
  throws(() => resolveMove(10, 7), "roll above six");
  throws(() => resolveMove(10, 0), "roll below one");
  throws(() => boardCoordinate(0), "square 0 is off the board");
});

test("a full game always finishes and never leaves the board", () => {
  // Play many random games. Every position must stay within 0-100, and each
  // game must end in a win rather than looping forever.
  for (let game = 0; game < 500; game += 1) {
    let position = 0;
    let turns = 0;

    while (position !== WINNING_SQUARE) {
      const result = resolveMove(position, rollDie());
      position = result.position;

      if (position < 0 || position > WINNING_SQUARE) {
        throw new Error(`player left the board at ${position}`);
      }

      turns += 1;
      if (turns > 10000) {
        throw new Error("game did not finish within 10000 turns");
      }
    }
  }
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

print("");
print(`${passed} passed, ${failed} failed`);

// Signal failure to the shell so scripts and CI can detect a broken build.
if (failed > 0 && typeof globalThis.process !== "undefined") {
  globalThis.process.exitCode = 1;
}
