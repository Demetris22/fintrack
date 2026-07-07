import { useReducedMotion } from "motion/react";
import AnimatedCurrency from "./AnimatedCurrency";
import CountUp from "./CountUp";

function SummaryCards({
  wallets = [],
  transactions = [],
  budgets = [],
  isUpdating = false,
}) {
  const shouldReduceMotion = useReducedMotion();

  function getWalletBalance(wallet) {
    return (
      wallet.balance ??
      wallet.availableBalance ??
      wallet.currentBalance ??
      wallet.amount ??
      0
    );
  }

  const walletTotalsByCurrency = wallets.reduce((totals, wallet) => {
    const currency = wallet.currency || "EUR";
    const currentTotal = totals[currency] || 0;

    return {
      ...totals,
      [currency]: currentTotal + Number(getWalletBalance(wallet)),
    };
  }, {});

  const activeCurrencyCount = Object.keys(walletTotalsByCurrency).length;

  const walletBalanceEntries =
    activeCurrencyCount === 0
      ? [["EUR", 0]]
      : Object.entries(walletTotalsByCurrency);

  const totalSpending = transactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0
  );

  const totalBudget = budgets.reduce(
    (sum, budget) => sum + Number(budget.monthlyLimit),
    0
  );

  const budgetedCategories = budgets.map((budget) =>
    budget.category.toLowerCase()
  );

  const spendingInBudgetedCategories = transactions
    .filter((transaction) =>
      budgetedCategories.includes(
        (transaction.category || "Uncategorized").toLowerCase()
      )
    )
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const remainingBudget = totalBudget - spendingInBudgetedCategories;

  return (
    <div className={isUpdating ? "summary-grid is-updating" : "summary-grid"}>
      <div className="summary-card wallet-summary-card">
        <div className="summary-icon blue">EUR</div>
        <h3>Total Wallet Balance</h3>
        <p className="summary-value compact currency-total-list">
          {walletBalanceEntries.map(([currency, total], index) => (
            <span className="currency-total-item" key={currency}>
              {index > 0 && (
                <span className="currency-total-separator">+</span>
              )}
              <AnimatedCurrency amount={total} currency={currency} />
            </span>
          ))}
        </p>
        <span className="summary-subtext">Across active wallets</span>
      </div>

      <div className="summary-card wallet-summary-card">
        <div className="summary-icon green">ID</div>
        <h3>Wallets</h3>
        <p className="summary-value">
          {shouldReduceMotion ? (
            wallets.length
          ) : (
            <CountUp
              from={0}
              to={wallets.length}
              separator=","
              duration={1}
              className="count-up-number"
            />
          )}
        </p>
        <span className="summary-subtext">
          {activeCurrencyCount} active{" "}
          {activeCurrencyCount === 1 ? "currency" : "currencies"}
        </span>
      </div>

      <div className="summary-card">
        <div className="summary-icon orange">TX</div>
        <h3>Tracked Spending</h3>
        <p className="summary-value">
          <AnimatedCurrency amount={totalSpending} />
        </p>
        <span className="summary-subtext">Across transactions</span>
      </div>

      <div className="summary-card">
        <div className="summary-icon purple">BD</div>
        <h3>Budget Remaining</h3>
        <p
          className={
            remainingBudget < 0 ? "summary-value negative" : "summary-value"
          }
        >
          <AnimatedCurrency amount={remainingBudget} />
        </p>
        <span className="summary-subtext">
          {remainingBudget < 0 ? "Over budget" : "Still available"}
        </span>
      </div>
    </div>
  );
}

export default SummaryCards;
