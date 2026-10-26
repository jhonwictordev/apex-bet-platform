import crypto from "crypto";

export interface Card {
  suit: "♠" | "♥" | "♦" | "♣";
  rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
  value: number;
}

export interface BlackjackGameState {
  id: string;
  deck: Card[];
  playerCards: Card[];
  dealerCards: Card[];
  playerScore: number;
  dealerScore: number;
  betAmount: number;
  status: "IN_PROGRESS" | "PLAYER_BUST" | "DEALER_BUST" | "PLAYER_WIN" | "DEALER_WIN" | "PUSH" | "BLACKJACK";
  payout: number;
  multiplier: number;
}

export class BlackjackEngine {
  private static SUITS: ("♠" | "♥" | "♦" | "♣")[] = ["♠", "♥", "♦", "♣"];
  private static RANKS: ("2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A")[] = [
    "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"
  ];

  static createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of this.SUITS) {
      for (const rank of this.RANKS) {
        let value = parseInt(rank);
        if (["J", "Q", "K"].includes(rank)) value = 10;
        if (rank === "A") value = 11;
        deck.push({ suit, rank, value });
      }
    }
    return this.shuffle(deck);
  }

  private static shuffle(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static calculateScore(cards: Card[]): number {
    let score = 0;
    let aces = 0;

    for (const card of cards) {
      if (card.rank === "A") {
        aces++;
        score += 11;
      } else {
        score += card.value;
      }
    }

    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }

    return score;
  }

  static dealInitial(betAmount: number): BlackjackGameState {
    const deck = this.createDeck();
    const playerCards = [deck.pop()!, deck.pop()!];
    const dealerCards = [deck.pop()!, deck.pop()!];

    const playerScore = this.calculateScore(playerCards);
    const dealerScore = this.calculateScore(dealerCards);

    const isPlayerBJ = playerCards.length === 2 && playerScore === 21;
    const isDealerBJ = dealerCards.length === 2 && dealerScore === 21;

    let status: BlackjackGameState["status"] = "IN_PROGRESS";
    let payout = 0;
    let multiplier = 0;

    if (isPlayerBJ && isDealerBJ) {
      status = "PUSH";
      payout = betAmount;
      multiplier = 1.0;
    } else if (isPlayerBJ) {
      status = "BLACKJACK";
      payout = betAmount * 2.5; // 3:2 payout
      multiplier = 2.5;
    }

    return {
      id: crypto.randomUUID(),
      deck,
      playerCards,
      dealerCards,
      playerScore,
      dealerScore,
      betAmount,
      status,
      payout,
      multiplier,
    };
  }

  static hit(state: BlackjackGameState): BlackjackGameState {
    if (state.status !== "IN_PROGRESS") return state;

    const newDeck = [...state.deck];
    const nextCard = newDeck.pop();
    if (!nextCard) return state;

    const newPlayerCards = [...state.playerCards, nextCard];
    const playerScore = this.calculateScore(newPlayerCards);

    if (playerScore > 21) {
      return {
        ...state,
        deck: newDeck,
        playerCards: newPlayerCards,
        playerScore,
        status: "PLAYER_BUST",
        payout: 0,
        multiplier: 0,
      };
    }

    return {
      ...state,
      deck: newDeck,
      playerCards: newPlayerCards,
      playerScore,
    };
  }

  static stand(state: BlackjackGameState): BlackjackGameState {
    if (state.status !== "IN_PROGRESS") return state;

    const newDeck = [...state.deck];
    const dealerCards = [...state.dealerCards];
    let dealerScore = this.calculateScore(dealerCards);

    // Dealer hits on soft 17 or less than 17
    while (dealerScore < 17 && newDeck.length > 0) {
      dealerCards.push(newDeck.pop()!);
      dealerScore = this.calculateScore(dealerCards);
    }

    const playerScore = state.playerScore;
    let status: BlackjackGameState["status"];
    let payout = 0;
    let multiplier = 0;

    if (dealerScore > 21) {
      status = "DEALER_BUST";
      payout = state.betAmount * 2.0;
      multiplier = 2.0;
    } else if (playerScore > dealerScore) {
      status = "PLAYER_WIN";
      payout = state.betAmount * 2.0;
      multiplier = 2.0;
    } else if (playerScore < dealerScore) {
      status = "DEALER_WIN";
      payout = 0;
      multiplier = 0;
    } else {
      status = "PUSH";
      payout = state.betAmount;
      multiplier = 1.0;
    }

    return {
      ...state,
      deck: newDeck,
      dealerCards,
      dealerScore,
      status,
      payout,
      multiplier,
    };
  }
}
