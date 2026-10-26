import crypto from "crypto";

export type RouletteBetType =
  | "straight"
  | "red"
  | "black"
  | "even"
  | "odd"
  | "low"
  | "high"
  | "dozen1"
  | "dozen2"
  | "dozen3"
  | "col1"
  | "col2"
  | "col3";

export interface RouletteBetPlacement {
  type: RouletteBetType;
  value?: number; // For straight bet: 0 - 36
  amount: number;
}

export interface RouletteSpinResult {
  winningNumber: number;
  color: "red" | "black" | "green";
  totalStake: number;
  totalPayout: number;
  multiplier: number;
  serverSeed: string;
}

export class RouletteEngine {
  private static RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

  static spin(bets: RouletteBetPlacement[], serverSeed?: string): RouletteSpinResult {
    const seed = serverSeed || crypto.randomBytes(32).toString("hex");
    const hmac = crypto.createHmac("sha256", seed);
    hmac.update("roulette_wheel_spin");
    const hash = hmac.digest("hex");

    // Number between 0 and 36
    const winningNumber = parseInt(hash.substring(0, 8), 16) % 37;

    const color: "red" | "black" | "green" =
      winningNumber === 0 ? "green" : this.RED_NUMBERS.includes(winningNumber) ? "red" : "black";

    let totalStake = 0;
    let totalPayout = 0;

    for (const bet of bets) {
      totalStake += bet.amount;
      const payout = this.evaluateBet(bet, winningNumber, color);
      totalPayout += payout;
    }

    const multiplier = totalStake > 0 ? Number((totalPayout / totalStake).toFixed(2)) : 0;

    return {
      winningNumber,
      color,
      totalStake,
      totalPayout,
      multiplier,
      serverSeed: seed,
    };
  }

  private static evaluateBet(
    bet: RouletteBetPlacement,
    winningNumber: number,
    color: "red" | "black" | "green"
  ): number {
    switch (bet.type) {
      case "straight":
        return bet.value === winningNumber ? bet.amount * 36 : 0;
      case "red":
        return color === "red" ? bet.amount * 2 : 0;
      case "black":
        return color === "black" ? bet.amount * 2 : 0;
      case "even":
        return winningNumber !== 0 && winningNumber % 2 === 0 ? bet.amount * 2 : 0;
      case "odd":
        return winningNumber !== 0 && winningNumber % 2 !== 0 ? bet.amount * 2 : 0;
      case "low":
        return winningNumber >= 1 && winningNumber <= 18 ? bet.amount * 2 : 0;
      case "high":
        return winningNumber >= 19 && winningNumber <= 36 ? bet.amount * 2 : 0;
      case "dozen1":
        return winningNumber >= 1 && winningNumber <= 12 ? bet.amount * 3 : 0;
      case "dozen2":
        return winningNumber >= 13 && winningNumber <= 24 ? bet.amount * 3 : 0;
      case "dozen3":
        return winningNumber >= 25 && winningNumber <= 36 ? bet.amount * 3 : 0;
      case "col1":
        return winningNumber > 0 && winningNumber % 3 === 1 ? bet.amount * 3 : 0;
      case "col2":
        return winningNumber > 0 && winningNumber % 3 === 2 ? bet.amount * 3 : 0;
      case "col3":
        return winningNumber > 0 && winningNumber % 3 === 0 ? bet.amount * 3 : 0;
      default:
        return 0;
    }
  }
}
