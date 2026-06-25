import { useCallback, useEffect, useState } from "react";
import { getWalletTransactions } from "../services/api";

function WalletActivityPanel({ wallets, refreshKey = 0 }) {
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const selectedWalletExists = wallets.some(
    (wallet) => wallet.id === selectedWalletId
  );
  const activeWalletId =
    selectedWalletExists || wallets.length === 0
      ? selectedWalletId
      : wallets[0].id;

  const loadWalletTransactions = useCallback(
    async (walletId = activeWalletId) => {
      if (!walletId) {
        return;
      }

      setError("");
      setIsLoading(true);

      try {
        const data = await getWalletTransactions(walletId);
        setTransactions(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [activeWalletId]
  );

  useEffect(() => {
    if (!activeWalletId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      loadWalletTransactions(activeWalletId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeWalletId, refreshKey, loadWalletTransactions]);

  function formatCurrency(amount, currency = "EUR") {
    return new Intl.NumberFormat("en-CY", {
      style: "currency",
      currency,
    }).format(Number(amount || 0));
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "No date";
    }

    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getWalletEffect(transaction) {
    const posting = transaction.postings?.find(
      (item) => item.walletId === activeWalletId
    );

    if (!posting) {
      const isDestination = transaction.destinationWalletId === activeWalletId;
      const isSource = transaction.sourceWalletId === activeWalletId;

      return {
        sign: isDestination ? "+" : isSource ? "-" : "",
        amount: transaction.amount,
        currency: transaction.currency || "EUR",
      };
    }

    const isCredit = posting.direction?.toLowerCase() === "credit";

    return {
      sign: isCredit ? "+" : "-",
      amount: posting.amount,
      currency: posting.currency || transaction.currency || "EUR",
    };
  }

  function getTransactionLabel(transaction) {
    const type = transaction.type || "transaction";

    if (type.toLowerCase() === "deposit") {
      return "Deposit";
    }

    if (type.toLowerCase() === "transfer") {
      return "Transfer";
    }

    return type;
  }

  return (
    <div className="card dashboard-card wallet-activity-card">
      {wallets.length === 0 ? (
        <div className="empty-state">
          <h3>No wallets available</h3>
          <p>Create a wallet first to view wallet activity.</p>
        </div>
      ) : (
        <>
          <div className="wallet-activity-toolbar">
            <div className="form-field wallet-activity-select">
              <label>Select wallet</label>

              <select
                value={activeWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
              >
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.currency} Wallet
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => loadWalletTransactions()}
              disabled={!activeWalletId || isLoading}
            >
              {isLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {error && <p className="error">{error}</p>}

          {transactions.length === 0 ? (
            <div className="empty-state">
              <h3>No wallet activity yet</h3>
              <p>Deposits and transfers will appear here.</p>
            </div>
          ) : (
            <div className="data-list">
              {transactions.map((transaction) => {
                const effect = getWalletEffect(transaction);
                const isCredit = effect.sign === "+";
                const amountClass = isCredit ? "credit" : "debit";

                return (
                  <div className="data-row transaction-row" key={transaction.id}>
                    <div>
                      <div className="row-title">
                        <span className={`activity-icon ${amountClass}`}>
                          {isCredit ? "+" : "-"}
                        </span>

                        <h3>{getTransactionLabel(transaction)}</h3>
                      </div>

                      <p>{transaction.description || "No description"}</p>

                      <small>{formatDate(transaction.createdAt)}</small>
                    </div>

                    <strong className={`activity-amount ${amountClass}`}>
                      {effect.sign}
                      {formatCurrency(effect.amount, effect.currency)}
                    </strong>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default WalletActivityPanel;
