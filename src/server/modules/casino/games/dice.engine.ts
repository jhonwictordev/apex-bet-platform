import crypto from "crypto";

export type DiceCondition = "ROLL_OVER" | "ROLL_UNDER";

export interface DiceRollResult {
  rollValue: number;
  condition: DiceCondition;
  target: number;
  winChance: number;
  multiplier: number;
  isWon: boolean;
  payout: number;
  serverSeed: string;
}

export class DiceEngine {
  private static HOUSE_EDGE = 0.01; // 1%

  static calculateMultiplier(target: number, condition: DiceCondition): { winChance: number; multiplier: number } {
    let winChance = condition === "ROLL_OVER" ? 100 - target : target;
    winChance = Math.max(0.01, Math.min(98.0, winChance));

    // Multiplier = (100 - houseEdge) / winChance
    const multiplier = Number(((100 * (1 - this.HOUSE_EDGE)) / winChance).toFixed(4));
    return { winChance, multiplier };
  }

  static roll(betAmount: number, target: number, condition: DiceCondition, serverSeed?: string): DiceRollResult {
    const seed = serverSeed || crypto.randomBytes(32).toString("hex");
    const hmac = crypto.createHmac("sha256", seed);
    hmac.update(`dice_roll_${condition}_${target}`);
    const hash = hmac.digest("hex");

    // Float between 0.00 and 99.99
    const hex = hash.substring(0, 8);
    const rollValue = Number(((parseInt(hex, 16) % 10000) / 100).toFixed(2));

    const { winChance, multiplier } = this.calculateMultiplier(target, condition);

    const isWon = condition === "ROLL_OVER" ? rollValue > target : rollValue < target;
    const payout = isWon ? Number((betAmount * multiplier).toFixed(2)) : 0.0;

    return {
      rollValue,
      condition,
      target,
      winChance,
      multiplier,
      isWon,
      payout,
      serverSeed: seed,
    };
  }
}
