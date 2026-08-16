/*
 * game.js — everything the player actually sees and clicks.
 *
 * This file handles the screen: drawing the board, moving the tokens, running
 * the animations and reacting to clicks. It does NOT decide any game rules.
 * All the rules live in game-core.js and are imported below, which is why this
 * file never works out where a snake leads or who has won.
 */

import {
  LADDERS,
  SNAKES,
  boardCoordinate,
  resolveMove,
  rollDie,
} from "./game-core.js";

// ---------------------------------------------------------------------------
// References to the page elements
// ---------------------------------------------------------------------------
// Looked up once here so we are not searching the document on every frame.

const board = document.querySelector("#board");
const routes = document.querySelector("#routes");
const tokensLayer = document.querySelector("#tokens-layer");
const rollButton = document.querySelector("#roll-button");
const dice = document.querySelector("#dice");
const turnName = document.querySelector("#turn-name");
const turnToken = document.querySelector("#turn-token");
const turnMessage = document.querySelector("#turn-message");
const roundLabel = document.querySelector("#round-label");
const gameLog = document.querySelector("#game-log");
const setupDialog = document.querySelector("#setup-dialog");
const setupForm = document.querySelector("#setup-form");
const winnerDialog = document.querySelector("#winner-dialog");

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

/*
 * One object holding everything that changes during a game.
 *
 *   players       — name and current square (0 means "not on the board yet")
 *   currentPlayer — 0 or 1, whose turn it is
 *   round         — counts up each time play returns to player one
 *   rolling       — true while an animation is playing. This blocks a second
 *                   roll from starting mid-move, which would corrupt the board.
 *   gameOver      — true once somebody has won, so no further rolls count
 */
const state = {
  players: [
    { name: "Player 1", position: 0 },
    { name: "Player 2", position: 0 },
  ],
  currentPlayer: 0,
  round: 1,
  rolling: false,
  gameOver: false,
};

// Pauses for a number of milliseconds. Used with `await` to space out the
// animation steps so a move is easy to follow with the eye.
const delay = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

// ---------------------------------------------------------------------------
// Drawing the board
// ---------------------------------------------------------------------------

/*
 * Builds the 10x10 grid of numbered squares.
 *
 * The squares are added in the order they appear on screen: the top row first
 * (91-100) down to the bottom row (1-10). Because the board snakes back and
 * forth, every second row is reversed so the numbers zig-zag like a real board.
 */
function buildBoard() {
  // A fragment collects all 100 cells in memory, so the page is only redrawn
  // once at the end instead of 100 separate times.
  const fragment = document.createDocumentFragment();

  for (let row = 9; row >= 0; row -= 1) {
    const start = row * 10 + 1;
    const squares = Array.from({ length: 10 }, (_, index) => start + index);

    // Odd rows run right to left on a real Snake & Ladder board.
    if (row % 2 === 1) squares.reverse();

    for (const square of squares) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.number = square;
      cell.innerHTML = `<span class="cell-number">${square}</span>`;
      fragment.append(cell);
    }
  }

  board.replaceChildren(fragment);
}

/*
 * Creates an SVG element such as a line or circle.
 *
 * SVG elements need createElementNS (the "NS" is for XML namespace) rather than
 * the usual createElement, otherwise the browser creates an unknown HTML tag
 * that renders as nothing at all.
 */
function svgElement(tag, attributes) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
}

/*
 * Draws one ladder as two side rails with rungs between them.
 *
 * The rails have to sit either side of the centre line rather than on it, so we
 * work out a short "perpendicular" offset: swapping dx and dy and negating one
 * of them turns a direction into the direction at right angles to it.
 */
function drawLadder(start, end) {
  const from = boardCoordinate(start);
  const to = boardCoordinate(end);
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Straight-line distance between the two squares.
  const length = Math.hypot(dx, dy);

  // A vector at right angles to the ladder, 16 units long: half the rail gap.
  const offsetX = (-dy / length) * 16;
  const offsetY = (dx / length) * 16;

  const group = svgElement("g", {});

  // The two rails: one offset to each side of the centre line.
  for (const side of [-1, 1]) {
    group.append(
      svgElement("line", {
        class: "ladder-rail",
        x1: from.x + offsetX * side,
        y1: from.y + offsetY * side,
        x2: to.x + offsetX * side,
        y2: to.y + offsetY * side,
      }),
    );
  }

  // The rungs, spaced evenly along the ladder. Longer ladders get more rungs,
  // with a minimum of three so even short ladders still look like ladders.
  const rungCount = Math.max(3, Math.floor(length / 70));
  for (let index = 1; index < rungCount; index += 1) {
    const progress = index / rungCount;
    const x = from.x + dx * progress;
    const y = from.y + dy * progress;
    group.append(
      svgElement("line", {
        class: "ladder-rung",
        x1: x - offsetX,
        y1: y - offsetY,
        x2: x + offsetX,
        y2: y + offsetY,
      }),
    );
  }

  routes.append(group);
}

/*
 * Draws one snake as a curved line with two eyes at the head.
 *
 * `index` is the snake's position in the list, used only to alternate which way
 * each snake bends so that neighbouring snakes do not overlap into a blur.
 */
function drawSnake(head, tail, index) {
  const from = boardCoordinate(head);
  const to = boardCoordinate(tail);
  const dy = to.y - from.y;

  // How far the curve bulges sideways, flipping direction for every other snake.
  const bend = index % 2 === 0 ? 85 : -85;

  // "C" draws a cubic Bezier curve: two control points pull the line into an
  // S-shape between the head and the tail.
  const path = [
    `M ${from.x} ${from.y}`,
    `C ${from.x + bend} ${from.y + dy * 0.25},`,
    `${to.x - bend} ${to.y - dy * 0.25},`,
    `${to.x} ${to.y}`,
  ].join(" ");

  routes.append(
    // A thicker dark line drawn underneath gives the snake a soft outline.
    svgElement("path", { class: "route-shadow", d: path }),
    svgElement("path", { class: "snake-route", d: path }),
    svgElement("circle", { class: "snake-eye", cx: from.x - 6, cy: from.y - 4, r: 5 }),
    svgElement("circle", { class: "snake-eye", cx: from.x + 6, cy: from.y - 4, r: 5 }),
  );
}

// Draws every snake and ladder onto the SVG layer that sits over the grid.
function drawRoutes() {
  routes.replaceChildren();

  // Object keys are always strings, so each square number is converted back
  // to a number before it is used for maths.
  Object.entries(LADDERS).forEach(([start, end]) => drawLadder(Number(start), end));
  Object.entries(SNAKES).forEach(([head, tail], index) =>
    drawSnake(Number(head), tail, index),
  );
}

// ---------------------------------------------------------------------------
// Player tokens
// ---------------------------------------------------------------------------

// Creates the two coloured playing pieces and puts them at the starting corner.
function createTokens() {
  tokensLayer.replaceChildren();

  state.players.forEach((player, index) => {
    const token = document.createElement("span");
    token.className = `token token-${index === 0 ? "one" : "two"}`;
    token.id = `board-token-${index}`;
    token.textContent = `P${index + 1}`;
    // Screen readers announce this, so players who cannot see the board still
    // know where each piece is.
    token.setAttribute("aria-label", `${player.name} at the start`);
    tokensLayer.append(token);
    positionToken(index, 0);
  });
}

/*
 * Moves one token to a square.
 *
 *   playerIndex — 0 or 1
 *   position    — the square to move to, or 0 for the off-board start
 *   moving      — true while mid-animation, which adds a slight "lift" effect
 */
function positionToken(playerIndex, position, moving = false) {
  const token = document.querySelector(`#board-token-${playerIndex}`);
  if (!token) return;

  // Position 0 is not a real square, so the token waits just below the board.
  const coordinate = position === 0 ? { x: 45, y: 970 } : boardCoordinate(position);

  // If both players are on the same square, nudge them apart so the token
  // underneath is not completely hidden.
  const sharedSquare = state.players.some(
    (player, index) =>
      index !== playerIndex && player.position === position && position > 0,
  );
  const offset = sharedSquare ? (playerIndex === 0 ? -14 : 14) : 0;

  // The coordinates are on a 1000-unit grid, so dividing by 10 converts them
  // into percentages. Percentages keep the tokens aligned at any screen size.
  token.style.left = `${(coordinate.x + offset) / 10}%`;
  token.style.top = `${coordinate.y / 10}%`;
  token.classList.toggle("moving", moving);
  token.setAttribute(
    "aria-label",
    `${state.players[playerIndex].name} on square ${position}`,
  );
}

// ---------------------------------------------------------------------------
// Updating the sidebar
// ---------------------------------------------------------------------------

/*
 * Turns a name into up to two initials for the small round badges.
 * "Pratham Kapadia" becomes "PK". If the name has no usable letters the
 * fallback ("P1" or "P2") is used instead.
 */
function initials(name, fallback) {
  const value = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return value || fallback;
}

// Redraws every part of the sidebar so it matches the current game state.
function updateInterface() {
  state.players.forEach((player, index) => {
    document.querySelector(`#player-name-${index}`).textContent = player.name;
    document.querySelector(`#player-position-${index}`).textContent = player.position;
    document.querySelector(`#avatar-${index}`).textContent = initials(
      player.name,
      `P${index + 1}`,
    );

    // Highlight the row belonging to whoever is about to roll.
    document
      .querySelector(`#player-row-${index}`)
      .classList.toggle("active", index === state.currentPlayer && !state.gameOver);

    document.querySelector(`#player-status-${index}`).textContent =
      state.gameOver && player.position === 100
        ? "Winner!"
        : index === state.currentPlayer
          ? "Ready to roll"
          : "Waiting";

    positionToken(index, player.position);
  });

  const current = state.players[state.currentPlayer];
  turnName.textContent = current.name;
  turnToken.textContent = initials(current.name, `P${state.currentPlayer + 1}`);
  turnToken.className = `turn-token player-${state.currentPlayer === 0 ? "one" : "two"}`;
  roundLabel.textContent = `Round ${state.round}`;
}

/*
 * Adds a line to the game log.
 * `type` chooses the arrow shown: up for a ladder, down for a snake.
 */
function addLog(message, type = "normal") {
  const item = document.createElement("li");
  const icon = type === "ladder" ? "↑" : type === "snake" ? "↓" : "●";
  item.innerHTML = `<span>${icon}</span>${message}`;

  // Newest entry goes on top.
  gameLog.prepend(item);

  // Keep only the eight most recent lines so the panel never grows forever.
  while (gameLog.children.length > 8) {
    gameLog.lastElementChild.remove();
  }
}

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

/*
 * Walks a token square by square from `from` to `to`.
 *
 * Stepping through each square (rather than jumping straight there) makes it
 * obvious to both players what happened. Long slides down a snake are sped up
 * so a big move does not feel slow.
 */
async function animateMove(playerIndex, from, to) {
  const direction = to >= from ? 1 : -1;
  const distance = Math.abs(to - from);
  const stepDelay = distance > 12 ? 35 : 120;

  for (
    let square = from + direction;
    direction > 0 ? square <= to : square >= to;
    square += direction
  ) {
    positionToken(playerIndex, square, true);
    await delay(stepDelay);
  }

  // Final call without the "moving" flag, which settles the token in place.
  positionToken(playerIndex, to);
}

/*
 * Plays the dice tumbling animation and finishes on the real value.
 *
 * The value was already decided before this function runs. The flickering
 * numbers are purely decorative and do not affect the outcome.
 */
async function showDiceRoll(value) {
  // Removing and re-adding the class restarts the CSS animation. Reading
  // offsetWidth in between forces the browser to notice the change.
  dice.classList.remove("rolling");
  void dice.offsetWidth;
  dice.classList.add("rolling");

  for (let index = 0; index < 6; index += 1) {
    dice.dataset.value = rollDie();
    await delay(65);
  }

  dice.dataset.value = value;
  dice.setAttribute("aria-label", `Dice showing ${value}`);
  await delay(150);
  dice.classList.remove("rolling");
}

// ---------------------------------------------------------------------------
// Playing a turn
// ---------------------------------------------------------------------------

/*
 * Runs one complete turn: roll, move, apply any snake or ladder, then either
 * declare a winner or hand play over to the other player.
 */
async function takeTurn() {
  // Ignore clicks during an animation or after the game has been won.
  if (state.rolling || state.gameOver) return;

  state.rolling = true;
  rollButton.disabled = true;

  const playerIndex = state.currentPlayer;
  const player = state.players[playerIndex];
  const oldPosition = player.position;
  const roll = rollDie();

  turnMessage.textContent = `${player.name} is rolling…`;
  await showDiceRoll(roll);

  // The rules module decides the outcome; this file only shows it.
  const result = resolveMove(oldPosition, roll);
  addLog(`${player.name} rolled ${roll}.`);

  if (result.effect === "overshoot") {
    // Too big a roll near the end: the player does not move at all.
    turnMessage.textContent = `You need an exact roll. ${player.name} stays on ${oldPosition}.`;
    addLog(`${player.name} needs an exact roll to reach 100.`);
  } else {
    // First animate the plain dice move to the square that was landed on.
    await animateMove(playerIndex, oldPosition, result.landedOn);
    player.position = result.landedOn;

    // Then, if that square held a snake or ladder, animate the second move.
    if (result.effect === "ladder" || result.effect === "snake") {
      const isLadder = result.effect === "ladder";

      turnMessage.textContent = isLadder
        ? `A ladder! ${result.landedOn} → ${result.position}`
        : `Oh no — a snake! ${result.landedOn} → ${result.position}`;

      addLog(
        isLadder
          ? `${player.name} climbed from ${result.landedOn} to ${result.position}.`
          : `${player.name} slid from ${result.landedOn} to ${result.position}.`,
        result.effect,
      );

      // A short pause lets the player register the square before they are moved.
      await delay(250);
      await animateMove(playerIndex, result.landedOn, result.position);
      player.position = result.position;
    } else {
      turnMessage.textContent = `${player.name} moved to square ${result.position}.`;
    }
  }

  if (result.won) {
    state.gameOver = true;
    updateInterface();

    document.querySelector("#winner-name").textContent = `${player.name} wins!`;
    document.querySelector("#winner-copy").textContent =
      `${player.name} reached square 100 in round ${state.round}.`;

    await delay(400);
    winnerDialog.showModal();

    // Returning early deliberately leaves the roll button disabled.
    return;
  }

  // Hand over to the other player. A new round starts whenever play comes
  // back around to player one.
  state.currentPlayer = state.currentPlayer === 0 ? 1 : 0;
  if (state.currentPlayer === 0) state.round += 1;

  state.rolling = false;
  rollButton.disabled = false;
  updateInterface();
}

// ---------------------------------------------------------------------------
// Starting and restarting
// ---------------------------------------------------------------------------

/*
 * Clears the board and begins a fresh game.
 * `names` defaults to the current players, so a restart can keep the same names.
 * A blank name falls back to "Player 1" or "Player 2".
 */
function resetGame(names = state.players.map((player) => player.name)) {
  state.players = names.map((name, index) => ({
    name: name.trim() || `Player ${index + 1}`,
    position: 0,
  }));
  state.currentPlayer = 0;
  state.round = 1;
  state.rolling = false;
  state.gameOver = false;

  dice.dataset.value = "1";
  turnMessage.textContent = "The first player to reach 100 wins.";
  gameLog.innerHTML = "<li><span>●</span>Game ready. Roll to begin!</li>";

  createTokens();
  updateInterface();
  rollButton.disabled = false;
}

// Opens the name-entry dialog, pre-filled with the current names.
function openSetup() {
  document.querySelector("#player-one-input").value = state.players[0].name;
  document.querySelector("#player-two-input").value = state.players[1].name;
  setupDialog.showModal();
  // Selecting the text means typing immediately replaces the old name.
  document.querySelector("#player-one-input").select();
}

// ---------------------------------------------------------------------------
// Wiring up the buttons
// ---------------------------------------------------------------------------

// The form uses method="dialog", so submitting closes the dialog automatically
// and this listener only has to start the new game.
setupForm.addEventListener("submit", () => {
  resetGame([
    document.querySelector("#player-one-input").value,
    document.querySelector("#player-two-input").value,
  ]);
});

document.querySelector("#new-game-button").addEventListener("click", openSetup);

document.querySelector("#dialog-close").addEventListener("click", () => {
  setupDialog.close();
});

document.querySelector("#play-again-button").addEventListener("click", () => {
  winnerDialog.close();
  openSetup();
});

document.querySelector("#clear-log-button").addEventListener("click", () => {
  gameLog.innerHTML = "";
});

rollButton.addEventListener("click", takeTurn);

// Spacebar is a shortcut for rolling, ignored while a dialog is open so it does
// not fire while somebody is typing a name. `event.repeat` blocks the machine
// gun effect of a held-down key.
window.addEventListener("keydown", (event) => {
  if (
    event.code === "Space" &&
    !setupDialog.open &&
    !winnerDialog.open &&
    !event.repeat
  ) {
    event.preventDefault();
    takeTurn();
  }
});

// ---------------------------------------------------------------------------
// Start the game
// ---------------------------------------------------------------------------

buildBoard();
drawRoutes();
resetGame();
dice.dataset.value = "1";

// A short pause before the name dialog appears lets the board render first, so
// players see what they are about to play rather than an empty screen.
window.setTimeout(() => setupDialog.showModal(), 300);
