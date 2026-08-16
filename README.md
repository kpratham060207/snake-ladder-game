# Snake & Ladder

A two-player Snake and Ladder game. Play it in the browser with an animated
board, or compile the original C++ console version.

## Play in the browser

You only need Python 3, which macOS and most Linux systems already have. No
packages to install.

```sh
python3 -m http.server 8090
```

Then open [http://localhost:8090](http://localhost:8090).

Any free port works. If you see somebody else's page, that port is already in
use by another project — pick a different number and try again.

Enter both player names, then roll by clicking the dice or pressing the
spacebar. The game log on the right records every roll, climb and slide.

## Play in the terminal (C++)

Requires a C++17 compiler (Clang on macOS, GCC on Linux, MinGW or Visual Studio
on Windows).

```sh
clang++ -std=c++17 -Wall -Wextra -pedantic "Snake&ladder.cpp" -o snake-ladder
./snake-ladder
```

## Running the tests

The tests cover the game rules: ladders, snakes, the exact-roll finish, invalid
input, and a 500-game simulation checking that a game always ends and no player
ever leaves the board.

With Node.js:

```sh
node game-core.test.js
```

Without Node.js, any JavaScript engine works. On macOS you already have one:

```sh
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc -m game-core.test.js
```

## Rules

- Two players take alternating turns rolling one dice.
- You must land on square 100 **exactly** to win. A roll that would take you
  past 100 is wasted and you stay where you are.
- Landing on a ladder carries you up. Landing on a snake head drags you down.

| Ladders (up) | Snakes (down) |
| ------------ | ------------- |
| 3 → 27       | 32 → 10       |
| 8 → 30       | 36 → 6        |
| 28 → 84      | 48 → 26       |
| 51 → 67      | 88 → 24       |
| 71 → 99      | 95 → 56       |
| 80 → 99      |               |

## Project structure

| File                | Purpose                                                      |
| ------------------- | ------------------------------------------------------------ |
| `index.html`        | Page structure and dialogs                                    |
| `styles.css`        | Board and sidebar styling, responsive down to phone screens   |
| `game.js`           | Drawing, animation and turn handling                          |
| `game-core.js`      | The game rules, with no browser code so they can be tested    |
| `game-core.test.js` | Test suite for the rules                                      |
| `Snake&ladder.cpp`  | C++17 console version                                         |

The rules live in `game-core.js`, separate from the screen code in `game.js`.
That split is what makes the rules testable without a browser.
