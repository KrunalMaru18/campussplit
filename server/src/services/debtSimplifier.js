/**
 * Debt Simplifier and Smart Balance Engine for CampusSplit
 */

/**
 * Calculates member net balances, detailed pairwise debts, and simplified settlements.
 * @param {Array} members - Array of member objects: { id, name, email, avatar_url, upi_id }
 * @param {Array} expenses - Array of expenses with their splits
 * @param {Array} settlements - Array of recorded settlements
 */
function calculateGroupBalances(members, expenses = [], settlements = []) {
  // 1. Initialize member map and net balance accumulator
  const memberMap = new Map();
  const netBalances = {};
  const totalPaidByUser = {};
  const totalOwedByUser = {};

  members.forEach((m) => {
    memberMap.set(m.id, m);
    netBalances[m.id] = 0;
    totalPaidByUser[m.id] = 0;
    totalOwedByUser[m.id] = 0;
  });

  // Directed pairwise map: pairwise[fromUserId][toUserId] = amount
  const pairwiseDebt = {};
  members.forEach((m1) => {
    pairwiseDebt[m1.id] = {};
    members.forEach((m2) => {
      pairwiseDebt[m1.id][m2.id] = 0;
    });
  });

  // 2. Process Expenses
  expenses.forEach((expense) => {
    const payerId = expense.paid_by_id;
    const amount = Number(expense.amount) || 0;

    if (totalPaidByUser[payerId] !== undefined) {
      totalPaidByUser[payerId] += amount;
    }

    const splits = expense.splits || [];
    splits.forEach((split) => {
      const debtorId = split.user_id;
      const share = Number(split.amount_owed) || 0;

      if (totalOwedByUser[debtorId] !== undefined) {
        totalOwedByUser[debtorId] += share;
      }

      // Net balance adjustments
      if (netBalances[payerId] !== undefined) {
        netBalances[payerId] += share; // Payer gets credit for covering this split
      }
      if (netBalances[debtorId] !== undefined) {
        netBalances[debtorId] -= share; // Debtor owes this split
      }

      // Pairwise debt
      if (payerId !== debtorId && pairwiseDebt[debtorId] && pairwiseDebt[debtorId][payerId] !== undefined) {
        pairwiseDebt[debtorId][payerId] += share;
      }
    });
  });

  // 3. Process Settlements
  settlements.forEach((settlement) => {
    const payerId = settlement.payer_id;
    const receiverId = settlement.receiver_id;
    const amount = Number(settlement.amount) || 0;

    // A settlement is money transferred from payer to receiver to reduce debt.
    // Payer's net balance increases (debt reduced), Receiver's net balance decreases (credit redeemed).
    if (netBalances[payerId] !== undefined) {
      netBalances[payerId] += amount;
    }
    if (netBalances[receiverId] !== undefined) {
      netBalances[receiverId] -= amount;
    }

    // Adjust pairwise debt
    if (pairwiseDebt[payerId] && pairwiseDebt[payerId][receiverId] !== undefined) {
      pairwiseDebt[payerId][receiverId] -= amount;
    }
  });

  // 4. Net pairwise debts between pairs (A owes B vs B owes A)
  const detailedDebts = [];
  const processedPairs = new Set();

  members.forEach((m1) => {
    members.forEach((m2) => {
      if (m1.id >= m2.id) return; // avoid duplicates and self

      const debt1to2 = pairwiseDebt[m1.id]?.[m2.id] || 0;
      const debt2to1 = pairwiseDebt[m2.id]?.[m1.id] || 0;
      const netDebt = debt1to2 - debt2to1;

      if (netDebt > 0.01) {
        detailedDebts.push({
          from: memberMap.get(m1.id),
          to: memberMap.get(m2.id),
          amount: Math.round(netDebt * 100) / 100,
        });
      } else if (netDebt < -0.01) {
        detailedDebts.push({
          from: memberMap.get(m2.id),
          to: memberMap.get(m1.id),
          amount: Math.round(Math.abs(netDebt) * 100) / 100,
        });
      }
    });
  });

  // 5. Build member balance summary
  const memberBalances = members.map((m) => {
    const rawNet = netBalances[m.id] || 0;
    const roundedNet = Math.round(rawNet * 100) / 100;
    return {
      user: m,
      netBalance: roundedNet, // positive means they are owed money, negative means they owe
      status: roundedNet > 0.01 ? 'owed' : roundedNet < -0.01 ? 'owes' : 'settled',
      totalPaid: Math.round((totalPaidByUser[m.id] || 0) * 100) / 100,
      totalOwed: Math.round((totalOwedByUser[m.id] || 0) * 100) / 100,
    };
  });

  // 6. Greedy Min-Cash-Flow Simplification Algorithm
  // Creditors: netBalance > 0
  // Debtors: netBalance < 0
  const creditors = [];
  const debtors = [];

  Object.keys(netBalances).forEach((userId) => {
    const val = Math.round(netBalances[userId] * 100) / 100;
    if (val > 0.01) {
      creditors.push({ id: userId, amount: val });
    } else if (val < -0.01) {
      debtors.push({ id: userId, amount: -val }); // positive amount representing debt
    }
  });

  // Sort descending
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const simplifiedDebts = [];
  let cIndex = 0;
  let dIndex = 0;

  while (cIndex < creditors.length && dIndex < debtors.length) {
    const creditor = creditors[cIndex];
    const debtor = debtors[dIndex];

    const minAmount = Math.min(creditor.amount, debtor.amount);
    const roundedMin = Math.round(minAmount * 100) / 100;

    if (roundedMin > 0.01) {
      simplifiedDebts.push({
        from: memberMap.get(debtor.id),
        to: memberMap.get(creditor.id),
        amount: roundedMin,
      });
    }

    creditor.amount -= minAmount;
    debtor.amount -= minAmount;

    if (creditor.amount <= 0.01) {
      cIndex++;
    }
    if (debtor.amount <= 0.01) {
      dIndex++;
    }
  }

  return {
    memberBalances,
    detailedDebts,
    simplifiedDebts,
    totalTransactionsDetailed: detailedDebts.length,
    totalTransactionsSimplified: simplifiedDebts.length,
    transactionsSaved: Math.max(0, detailedDebts.length - simplifiedDebts.length),
  };
}

module.exports = {
  calculateGroupBalances,
};
