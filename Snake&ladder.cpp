#include <array>
#include <iostream>
#include <limits>
#include <map>
#include <random>
#include <string>

namespace {
constexpr int kWinningSquare = 100;

const std::map<int, int> kLadders{
    {3, 27}, {8, 30}, {28, 84}, {51, 67}, {71, 99}, {80, 99},
};

const std::map<int, int> kSnakes{
    {32, 10}, {36, 6}, {48, 26}, {88, 24}, {95, 56},
};

struct Player {
    std::string name;
    int position = 0;
};

int rollDice() {
    static std::mt19937 engine(std::random_device{}());
    static std::uniform_int_distribution<int> distribution(1, 6);
    return distribution(engine);
}

void waitForEnter() {
    std::cout << "Press Enter to roll...";
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
}

void applyBoardEffect(Player& player) {
    if (const auto ladder = kLadders.find(player.position);
        ladder != kLadders.end()) {
        std::cout << "  Ladder! " << player.position << " -> "
                  << ladder->second << '\n';
        player.position = ladder->second;
        return;
    }

    if (const auto snake = kSnakes.find(player.position);
        snake != kSnakes.end()) {
        std::cout << "  Snake! " << player.position << " -> "
                  << snake->second << '\n';
        player.position = snake->second;
    }
}

bool takeTurn(Player& player) {
    std::cout << "\n" << player.name << "'s turn\n";
    waitForEnter();

    const int roll = rollDice();
    std::cout << "  Rolled: " << roll << '\n';

    if (player.position + roll > kWinningSquare) {
        std::cout << "  Exact roll required. You remain on "
                  << player.position << ".\n";
        return false;
    }

    player.position += roll;
    std::cout << "  Position: " << player.position << '\n';
    applyBoardEffect(player);

    return player.position == kWinningSquare;
}
}  // namespace

int main() {
    std::cout << "Welcome to Snake & Ladder!\n\n";

    std::array<Player, 2> players;
    for (std::size_t index = 0; index < players.size(); ++index) {
        std::cout << "Enter Player " << index + 1 << " name: ";
        std::getline(std::cin, players[index].name);
        if (players[index].name.empty()) {
            players[index].name = "Player " + std::to_string(index + 1);
        }
    }

    std::size_t currentPlayer = 0;
    while (true) {
        if (takeTurn(players[currentPlayer])) {
            std::cout << "\n" << players[currentPlayer].name
                      << " wins! Congratulations!\n";
            break;
        }
        currentPlayer = (currentPlayer + 1) % players.size();
    }

    return 0;
}