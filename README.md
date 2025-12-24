Snake & Ladder Game
A classic Snake and Ladder board game implementation in C++. This console-based application allows two players to compete against each other, featuring randomized dice rolls and automatic position updates for snakes and ladders.


Features
Two-Player Mode: Input custom names for both players.

Randomized Gameplay: Uses srand(time(0)) to ensure unique dice rolls every game.

Interactive Interface: Players press Enter to roll the dice.

Winning Logic: Exact roll required to reach position 100 to win; overshooting subtracts the dice value.

Prerequisites
To run this game, you need a C++ compiler installed on your system.

Windows: MinGW or Visual Studio.

Linux: GCC.

Mac: Clang (via Xcode command line tools).


How to Play
Launch the application.

Enter the name for User 1 and User 2 when prompted.

The game will announce whose turn it is.

Press Enter to roll the dice.

The game will display the rolled number and your new position on the board.

If you land on a Ladder, you move up automatically.

If you land on a Snake, you slide down automatically.

The first player to reach exactly 100 wins!

Game Logic (Map)
The game board includes the following hardcoded shortcuts and traps:

Ladders (Move Up)

3 -> 27

8 -> 30

28 -> 84

51 -> 67

71 -> 99

80 -> 99

Snakes (Move Down)

32 -> 10

36 -> 6

48 -> 26

88 -> 24

95 -> 56
