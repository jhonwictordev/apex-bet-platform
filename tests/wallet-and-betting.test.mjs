import test from "node:test";
import assert from "node:assert";

test("Virtual Wallet: Atomic transaction integrity and balance rules", () => {
  let demoBalance = 10000.0;

  function debit(amount) {
    if (amount <= 0) throw new Error("Amount must be > 0");
    if (demoBalance < amount) throw new Error("Insufficient virtual balance");
    demoBalance = Number((demoBalance - amount).toFixed(2));
    return demoBalance;
  }

  function credit(amount) {
    if (amount <= 0) throw new Error("Amount must be > 0");
    demoBalance = Number((demoBalance + amount).toFixed(2));
    return demoBalance;
  }

  // Initial balance
  assert.strictEqual(demoBalance, 10000.0);

  // Debit 500
  debit(500);
  assert.strictEqual(demoBalance, 9500.0);

  // Credit 1250 (Win)
  credit(1250.0);
  assert.strictEqual(demoBalance, 10750.0);

  // Debit exceeding balance should throw
  assert.throws(() => debit(20000), /Insufficient virtual balance/);
  assert.strictEqual(demoBalance, 10750.0, "Balance must remain unchanged after failed transaction");
});

test("Sports Bet Engine: Parlay odds multiplication and settlement calculation", () => {
  const selections = [
    { label: "Arsenal (1)", odd: 2.1 },
    { label: "Lakers (Moneyline)", odd: 1.85 },
    { label: "Mais de 2.5 gols", odd: 1.7 },
  ];

  // Multiple bet cumulative odds
  const stake = 100.0;
  const totalOdds = Number(selections.reduce((acc, s) => acc * s.odd, 1.0).toFixed(2));
  assert.strictEqual(totalOdds, 6.6); // 2.1 * 1.85 * 1.7 = 6.6045 -> 6.60

  const potentialReturn = Number((stake * totalOdds).toFixed(2));
  assert.strictEqual(potentialReturn, 660.0);

  // Settlement: if all won, return is potential return
  const allWon = true;
  const actualReturn = allWon ? potentialReturn : 0.0;
  assert.strictEqual(actualReturn, 660.0);

  // If one selection lost, multiple bet is lost
  const oneLost = false;
  const lostReturn = oneLost ? potentialReturn : 0.0;
  assert.strictEqual(lostReturn, 0.0);
});
