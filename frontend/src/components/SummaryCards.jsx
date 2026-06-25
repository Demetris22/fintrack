function SummaryCards({ wallets = [], transactions = [], budgets = [] }) {
  function formatCurrency(amount, currency = "EUR") {
    try {
      return new Intl.NumberFormat("en-CY", {
        style: "currency",
        currency,
      }).format(Number(amount || 0));
    } catch {
      return `${Number(amount || 0).toFixed(2)} ${currency}`;
    }
  }

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

  const walletBalanceLabel =
    activeCurrencyCount === 0
      ? formatCurrency(0)
      : Object.entries(walletTotalsByCurrency)
          .map(([currency, total]) => formatCurrency(total, currency))
          .join(" + ");

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
    <div className="summary-grid">
      <div className="summary-card wallet-summary-card">
        <div className="summary-icon blue">EUR</div>
        <h3>Total Wallet Balance</h3>
        <p className="summary-value compact">{walletBalanceLabel}</p>
        <span className="summary-subtext">Across active wallets</span>
      </div>

      <div className="summary-card wallet-summary-card">
        <div className="summary-icon green">ID</div>
        <h3>Wallets</h3>
        <p className="summary-value">{wallets.length}</p>
        <span className="summary-subtext">
          {activeCurrencyCount} active{" "}
          {activeCurrencyCount === 1 ? "currency" : "currencies"}
        </span>
      </div>

      <div className="summary-card">
        <div className="summary-icon orange">TX</div>
        <h3>Legacy Spending</h3>
        <p className="summary-value">{formatCurrency(totalSpending)}</p>
        <span className="summary-subtext">Across old transactions</span>
      </div>

      <div className="summary-card">
        <div className="summary-icon purple">BD</div>
        <h3>Budget Remaining</h3>
        <p
          className={
            remainingBudget < 0 ? "summary-value negative" : "summary-value"
          }
        >
          {formatCurrency(remainingBudget)}
        </p>
        <span className="summary-subtext">
          {remainingBudget < 0 ? "Over budget" : "Still available"}
        </span>
      </div>
    </div>
  );
}

export default SummaryCards;
