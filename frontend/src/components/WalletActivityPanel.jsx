import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { getWalletTransactions } from "../services/api";
import EmptyState from "./EmptyState";
import { Button, Card, FormField, SelectInput } from "./ui";

function WalletActivityPanel({ wallets, refreshKey = 0, onNotify }) {
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
        setTransactions(Array.isArray(data) ? data : []);
      } catch (err) {
        const message = err.message || "Could not load wallet activity.";

        setError(message);
        onNotify?.({ type: "error", message });
      } finally {
        setIsLoading(false);
      }
    },
    [activeWalletId, onNotify]
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

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "No date";
    }

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getWalletEffect(transaction) {
    const postings = Array.isArray(transaction.postings)
      ? transaction.postings
      : [];
    const posting = postings.find(
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
    <Card className="dashboard-card wallet-activity-card">
      {wallets.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No wallets available"
          description="Create a wallet first to view deposits, transfers, and balance movement."
        />
      ) : (
        <>
          <div className="wallet-activity-toolbar">
            <FormField label="Select wallet" className="wallet-activity-select">
              <SelectInput
                name="wallet-activity-wallet"
                autoComplete="off"
                value={activeWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
              >
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.currency} Wallet
                  </option>
                ))}
              </SelectInput>
            </FormField>

            <Button
              type="button"
              onClick={() => loadWalletTransactions()}
              disabled={!activeWalletId || isLoading}
              isLoading={isLoading}
            >
              {!isLoading && <RefreshCw size={16} strokeWidth={1.9} aria-hidden="true" />}
              {isLoading ? "Loading..." : "Refresh"}
            </Button>
          </div>

          {error && <p className="error" role="alert">{error}</p>}

          {isLoading && transactions.length === 0 ? (
            <div className="data-list activity-skeleton-list" aria-hidden="true">
              {[1, 2, 3].map((item) => (
                <div className="data-row transaction-row activity-row" key={item}>
                  <div className="activity-skeleton-main">
                    <span className="skeleton skeleton-icon"></span>
                    <div>
                      <span className="skeleton skeleton-line short"></span>
                      <span className="skeleton skeleton-line"></span>
                    </div>
                  </div>
                  <span className="skeleton skeleton-pill"></span>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No wallet activity yet"
              description="Deposits and transfers will appear here as soon as money moves."
            />
          ) : (
            <div className="data-list">
              {transactions.map((transaction, index) => {
                const effect = getWalletEffect(transaction);
                const isCredit = effect.sign === "+";
                const amountClass = isCredit ? "credit" : "debit";

                return (
                  <div
                    className={`data-row transaction-row activity-row ${amountClass}`}
                    key={transaction.id}
                    style={{ "--row-index": index }}
                  >
                    <div>
                      <div className="row-title">
                        <span className={`activity-icon ${amountClass}`}>
                          {isCredit ? (
                            <ArrowDownLeft size={16} strokeWidth={1.9} aria-hidden="true" />
                          ) : (
                            <ArrowUpRight size={16} strokeWidth={1.9} aria-hidden="true" />
                          )}
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
    </Card>
  );
}

export default WalletActivityPanel;
