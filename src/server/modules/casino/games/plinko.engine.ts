import crypto from "crypto";

export type PlinkoRisk = "LOW" | "MEDIUM" | "HIGH";

export interface PlinkoDropResult {
  path: number[]; // 0 for left, 1 for right
  slotIndex: number;
  multiplier: number;
  serverSeed: string;
}

export class PlinkoEngine {
  // Pre-calculated certified Plinko multipliers for 8 to 16 rows
  private static MULTIPLIER_TABLES: Record<number, Record<PlinkoRisk, number[]>> = {
    8: {
      LOW: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
      MEDIUM: [13.0, 3.0, 1.3, 0.7, 0.4, 0.7, 1.3, 3.0, 13.0],
      HIGH: [29.0, 4.0, 1.5, 0.3, 0.2, 0.3, 1.5, 4.0, 29.0],
    },
    10: {
      LOW: [8.9, 3.0, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 3.0, 8.9],
      MEDIUM: [22.0, 5.0, 2.0, 1.4, 0.6, 0.4, 0.6, 1.4, 2.0, 5.0, 22.0],
      HIGH: [76.0, 10.0, 3.0, 0.9, 0.3, 0.2, 0.3, 0.9, 3.0, 10.0, 76.0],
    },
    12: {
      LOW: [10.0, 3.0, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3.0, 10.0],
      MEDIUM: [33.0, 11.0, 4.0, 2.0, 1.1, 0.6, 0.3, 0.6, 1.1, 2.0, 4.0, 11.0, 33.0],
      HIGH: [170.0, 24.0, 8.1, 2.0, 0.7, 0.2, 0.2, 0.2, 0.7, 2.0, 8.1, 24.0, 170.0],
    },
    14: {
      LOW: [7.1, 4.0, 1.9, 1.4, 1.3, 1.1, 1.0, 0.5, 1.0, 1.1, 1.3, 1.4, 1.9, 4.0, 7.1],
      MEDIUM: [58.0, 15.0, 7.0, 4.0, 1.9, 1.0, 0.5, 0.2, 0.5, 1.0, 1.9, 4.0, 7.0, 15.0, 58.0],
      HIGH: [420.0, 56.0, 18.0, 5.0, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5.0, 18.0, 56.0, 420.0],
    },
    16: {
      LOW: [16.0, 9.0, 2.0, 1.4, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.4, 2.0, 9.0, 16.0],
      MEDIUM: [110.0, 41.0, 10.0, 5.0, 3.0, 1.5, 1.0, 0.5, 0.3, 0.5, 1.0, 1.5, 3.0, 5.0, 10.0, 41.0, 110.0],
      HIGH: [1000.0, 130.0, 26.0, 9.0, 4.0, 2.0, 0.2, 0.2, 0.2, 0.2, 0.2, 2.0, 4.0, 9.0, 26.0, 130.0, 1000.0],
    },
  };

  static dropBall(rows: number = 12, risk: PlinkoRisk = "MEDIUM", serverSeed?: string): PlinkoDropResult {
    // Validate rows (clamp to supported rows: 8, 10, 12, 14, 16)
    const validRows = [8, 10, 12, 14, 16];
    const targetRows = validRows.includes(rows) ? rows : 12;

    const seed = serverSeed || crypto.randomBytes(32).toString("hex");
    const path: number[] = [];
    let rightMoves = 0;

    for (let i = 0; i < targetRows; i++) {
      const hmac = crypto.createHmac("sha256", seed);
      hmac.update(`step_${i}`);
      const hash = hmac.digest("hex");
      const direction = parseInt(hash.substring(0, 4), 16) % 2; // 0: left, 1: right
      path.push(direction);
      if (direction === 1) rightMoves++;
    }

    const slotIndex = rightMoves;
    const table = this.MULTIPLIER_TABLES[targetRows][risk];
    const multiplier = table[slotIndex] ?? 1.0;

    return {
      path,
      slotIndex,
      multiplier,
      serverSeed: seed,
    };
  }

  static getMultiplierTable(rows: number = 12, risk: PlinkoRisk = "MEDIUM"): number[] {
    const validRows = [8, 10, 12, 14, 16];
    const targetRows = validRows.includes(rows) ? rows : 12;
    return this.MULTIPLIER_TABLES[targetRows][risk];
  }
}
