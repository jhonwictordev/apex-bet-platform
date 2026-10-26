import crypto from "crypto";

export interface MinesState {
  minesCount: number; // 1 to 24
  minePositions: number[]; // e.g. [3, 12, 19]
  revealedPositions: number[];
  isExploded: boolean;
  isCashedOut: boolean;
  currentMultiplier: number;
  serverSeed: string;
}

export class MinesEngine {
  private static TOTAL_TILES = 25;
  private static HOUSE_EDGE = 0.03; // 3%

  /**
   * Generates a random set of mine positions using cryptographic RNG.
   */
  static generateMinePositions(minesCount: number, serverSeed?: string): { minePositions: number[]; serverSeed: string } {
    if (minesCount < 1 || minesCount > 24) {
      throw new Error("O número de minas deve estar entre 1 e 24.");
    }

    const seed = serverSeed || crypto.randomBytes(32).toString("hex");
    const positions = Array.from({ length: this.TOTAL_TILES }, (_, i) => i);

    // Fisher-Yates shuffle with crypto
    for (let i = positions.length - 1; i > 0; i--) {
      const hmac = crypto.createHmac("sha256", seed);
      hmac.update(`${i}`);
      const hash = hmac.digest("hex");
      const j = parseInt(hash.substring(0, 8), 16) % (i + 1);
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    const minePositions = positions.slice(0, minesCount);

    return {
      minePositions,
      serverSeed: seed,
    };
  }

  /**
   * Calculates the exact multiplier after revealing `step` safe gems.
   * Multiplier formula: Prod_{i=0}^{k-1} (25 - i) / (25 - mines - i) * (1 - houseEdge)
   */
  static calculateMultiplier(minesCount: number, revealedCount: number): number {
    if (revealedCount === 0) return 1.0;

    const safeTiles = this.TOTAL_TILES - minesCount;
    if (revealedCount > safeTiles) {
      throw new Error("Revealed count exceeds safe tiles");
    }

    let multiplier = 1.0;
    for (let i = 0; i < revealedCount; i++) {
      multiplier *= (this.TOTAL_TILES - i) / (safeTiles - i);
    }

    const withHouseEdge = multiplier * (1 - this.HOUSE_EDGE);
    return Math.max(1.01, Number(withHouseEdge.toFixed(2)));
  }

  /**
   * Evaluates tile pick.
   */
  static pickTile(state: MinesState, tileIndex: number): { isMine: boolean; nextMultiplier: number } {
    if (tileIndex < 0 || tileIndex >= this.TOTAL_TILES) {
      throw new Error("Índice de peça inválido.");
    }

    if (state.revealedPositions.includes(tileIndex)) {
      throw new Error("Esta peça já foi revelada.");
    }

    const isMine = state.minePositions.includes(tileIndex);
    if (isMine) {
      return { isMine: true, nextMultiplier: 0.0 };
    }

    const nextCount = state.revealedPositions.length + 1;
    const nextMultiplier = this.calculateMultiplier(state.minesCount, nextCount);

    return {
      isMine: false,
      nextMultiplier,
    };
  }
}
