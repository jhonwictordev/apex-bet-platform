import crypto from "crypto";

export interface CrashGameConfig {
  houseEdge?: number; // default 0.03 (3%)
}

export interface CrashRoundResult {
  crashPoint: number;
  serverSeed: string;
  hash: string;
}

export class CrashEngine {
  private static HOUSE_EDGE = 0.03;

  /**
   * Generates a provably fair crash multiplier from server seed and salt.
   */
  static generateCrashPoint(serverSeed?: string, clientSeed: string = "apex-seed"): CrashRoundResult {
    const seed = serverSeed || crypto.randomBytes(32).toString("hex");
    const hmac = crypto.createHmac("sha256", seed);
    hmac.update(clientSeed);
    const hash = hmac.digest("hex");

    // Convert first 52 bits of hash to integer
    const hex52 = hash.substring(0, 13);
    const r = parseInt(hex52, 16);

    // 2^52
    const maxVal = Math.pow(2, 52);

    // 1 in 33 chance of instant crash at 1.00x
    const instantCrashChance = 0.03;
    if (r / maxVal < instantCrashChance) {
      return {
        crashPoint: 1.00,
        serverSeed: seed,
        hash,
      };
    }

    // Formula: (100 * maxVal - r * houseEdge) / (maxVal - r) / 100
    // Standard crash formula
    const rawMultiplier = Math.floor((100 * maxVal - r) / (maxVal - r)) / 100;
    const withHouseEdge = Math.max(1.00, Number((rawMultiplier * (1 - this.HOUSE_EDGE)).toFixed(2)));

    // Cap at 10,000x
    const crashPoint = Math.min(withHouseEdge, 10000.0);

    return {
      crashPoint,
      serverSeed: seed,
      hash,
    };
  }

  /**
   * Validates if a cashout multiplier was before or at the crash point.
   */
  static validateCashout(cashoutMultiplier: number, crashPoint: number): boolean {
    return cashoutMultiplier <= crashPoint;
  }
}
