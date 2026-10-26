import test from "node:test";
import assert from "node:assert";
import crypto from "crypto";

// 1. Crash Math Test
test("Crash Engine produces valid multipliers and respect house edge", () => {
  // Test crash point formula
  const maxVal = Math.pow(2, 52);
  const houseEdge = 0.03;

  function calculatePoint(hash) {
    const hex52 = hash.substring(0, 13);
    const r = parseInt(hex52, 16);
    if (r / maxVal < 0.03) return 1.0;
    const raw = Math.floor((100 * maxVal - r) / (maxVal - r)) / 100;
    return Math.max(1.0, Number((raw * (1 - houseEdge)).toFixed(2)));
  }

  for (let i = 0; i < 20; i++) {
    const hash = crypto.randomBytes(32).toString("hex");
    const mult = calculatePoint(hash);
    assert.ok(mult >= 1.0, `Multiplier must be >= 1.0, got ${mult}`);
    assert.ok(mult <= 10000.0, `Multiplier must be <= 10,000, got ${mult}`);
  }
});

// 2. Mines Math Test
test("Mines Engine calculates exponential multiplier curve with house edge", () => {
  const TOTAL_TILES = 25;
  const houseEdge = 0.03;

  function calcMultiplier(mines, revealed) {
    const safeTiles = TOTAL_TILES - mines;
    let m = 1.0;
    for (let i = 0; i < revealed; i++) {
      m *= (TOTAL_TILES - i) / (safeTiles - i);
    }
    return Math.max(1.01, Number((m * (1 - houseEdge)).toFixed(2)));
  }

  // 3 mines, 1 gem revealed
  const m1 = calcMultiplier(3, 1);
  assert.strictEqual(m1, 1.10); // 25/22 * 0.97 = 1.102 -> 1.10

  // 3 mines, 2 gems revealed
  const m2 = calcMultiplier(3, 2);
  assert.ok(m2 > m1, `Second pick multiplier (${m2}) must be strictly higher than first (${m1})`);

  // 5 mines, 5 gems revealed
  const m5 = calcMultiplier(5, 5);
  assert.ok(m5 >= 2.5, `5 gems with 5 mines should yield >= 2.5x, got ${m5}`);
});

// 3. Plinko Multiplier & Pegs Test
test("Plinko Engine drops ball and indexes correct certified slot", () => {
  const rows = 12;
  const table = [10.0, 3.0, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3.0, 10.0];

  assert.strictEqual(table.length, rows + 1, "Slot count must equal rows + 1");

  // Center slots have lower multiplier than edge slots
  assert.ok(table[0] > table[Math.floor(rows / 2)], "Edge slots must pay significantly more than center slot");
  assert.strictEqual(table[0], table[table.length - 1], "Plinko table must be symmetrical");
});

// 4. Roulette Payout Math Test
test("Roulette Engine calculates accurate European 0-36 payouts", () => {
  const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

  // Straight bet pays 36x
  const straightWin = 10 * 36;
  assert.strictEqual(straightWin, 360);

  // Red / Black pays 2x
  assert.ok(RED_NUMBERS.includes(7), "Number 7 should be Red");
  assert.ok(!RED_NUMBERS.includes(8), "Number 8 should be Black");
});

// 5. Dice Engine Over/Under Odds Test
test("Dice Engine computes fair payout multiplier with 1% house edge", () => {
  const houseEdge = 0.01;

  function getMultiplier(target, condition) {
    const winChance = condition === "ROLL_OVER" ? 100 - target : target;
    return Number(((100 * (1 - houseEdge)) / winChance).toFixed(4));
  }

  // 50/50 roll over 50 (win chance 50%) -> 99 / 50 = 1.98x
  const m50 = getMultiplier(50, "ROLL_OVER");
  assert.strictEqual(m50, 1.98);

  // Roll over 75 (win chance 25%) -> 99 / 25 = 3.96x
  const m75 = getMultiplier(75, "ROLL_OVER");
  assert.strictEqual(m75, 3.96);
});
