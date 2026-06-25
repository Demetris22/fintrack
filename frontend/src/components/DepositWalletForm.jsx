import { useState } from "react";
import { depositToWallet } from "../services/api";

function DepositWalletForm({ wallets, onDepositCompleted }) {
  const [walletId, setWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectiveWalletId = walletId || wallets[0]?.id || "";
  const selectedWallet = wallets.find(
    (wallet) => wallet.id === effectiveWalletId
  );
  const selectedWalletBalance = Number(
    selectedWallet?.balance ??
      selectedWallet?.availableBalance ??
      selectedWallet?.currentBalance ??
      0
  );

  function formatCurrency(value, currency = "EUR") {
    return new Intl.NumberFormat("en-CY", {
      style: "currency",
      currency,
    }).format(Number(value || 0));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!effectiveWalletId) {
      setError("Please select a wallet.");
      return;
    }

    if (Number(amount) <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    try {
      setIsSubmitting(true);

      await depositToWallet(effectiveWalletId, amount);

      setAmount("");

      if (onDepositCompleted) {
        await onDepositCompleted();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card form-card">
      <div className="form-card-header">
        <h2>Deposit to Wallet</h2>
        <p>Add funds to one of your existing wallets.</p>
      </div>

      {selectedWallet && (
        <div className="form-balance-panel">
          <div>
            <span>Selected wallet</span>
            <strong>{selectedWallet.currency} Wallet</strong>
          </div>

          <div>
            <span>Current balance</span>
            <strong>
              {formatCurrency(selectedWalletBalance, selectedWallet.currency)}
            </strong>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-field">
          <label>Wallet</label>

          <select
            value={effectiveWalletId}
            onChange={(e) => setWalletId(e.target.value)}
            required
          >
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.currency} Wallet -{" "}
                {formatCurrency(
                  wallet.balance ??
                    wallet.availableBalance ??
                    wallet.currentBalance ??
                    0,
                  wallet.currency
                )}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Amount</label>

          <input
            type="number"
            step="0.01"
            placeholder="Example: 100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="form-actions full-width">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Depositing..." : "Deposit"}
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default DepositWalletForm;
