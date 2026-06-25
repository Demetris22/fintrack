import { useState } from "react";
import { transferBetweenWallets } from "../services/api";

function TransferWalletForm({ wallets, onTransferCompleted }) {
  const [sourceWalletId, setSourceWalletId] = useState("");
  const [destinationWalletId, setDestinationWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [description, setDescription] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sourceWalletExists = wallets.some(
    (wallet) => wallet.id === sourceWalletId
  );
  const effectiveSourceWalletId =
    sourceWalletExists || wallets.length === 0 ? sourceWalletId : wallets[0].id;
  const selectedWallet = wallets.find(
    (wallet) => wallet.id === effectiveSourceWalletId
  );

  const selectedWalletBalance = Number(
    selectedWallet?.balance ??
      selectedWallet?.availableBalance ??
      selectedWallet?.currentBalance ??
      0
  );

  const amountNumber = Number(amount || 0);
  const isAmountTooHigh = amountNumber > selectedWalletBalance;
  const trimmedDestinationWalletId = destinationWalletId.trim();
  const remainingBalance = selectedWalletBalance - amountNumber;
  const effectiveCurrency = selectedWallet?.currency || currency || "EUR";

  function formatCurrency(value, walletCurrency = "EUR") {
    return new Intl.NumberFormat("en-CY", {
      style: "currency",
      currency: walletCurrency,
    }).format(Number(value || 0));
  }

  function handleSourceWalletChange(walletId) {
    setSourceWalletId(walletId);

    const wallet = wallets.find((item) => item.id === walletId);

    if (wallet) {
      setCurrency(wallet.currency || "EUR");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!effectiveSourceWalletId) {
      setError("Please select a source wallet.");
      return;
    }

    if (!trimmedDestinationWalletId) {
      setError("Please enter a destination wallet ID.");
      return;
    }

    if (effectiveSourceWalletId === trimmedDestinationWalletId) {
      setError("Source and destination wallets cannot be the same.");
      return;
    }

    if (amountNumber <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    if (amountNumber > selectedWalletBalance) {
      setError("You cannot transfer more than your available balance.");
      return;
    }

    try {
      setIsSubmitting(true);

      await transferBetweenWallets({
        sourceWalletId: effectiveSourceWalletId,
        destinationWalletId: trimmedDestinationWalletId,
        amount: amountNumber,
        currency: effectiveCurrency,
        description,
      });

      setDestinationWalletId("");
      setAmount("");
      setDescription("");

      if (onTransferCompleted) {
        await onTransferCompleted();
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
        <h2>Transfer Funds</h2>
        <p>Move money from one wallet to another wallet securely.</p>
      </div>

      {selectedWallet && (
        <div className="transfer-review-panel">
          <div>
            <span>Source wallet</span>
            <strong>{selectedWallet.currency} Wallet</strong>
            <small>{selectedWallet.id}</small>
          </div>

          <div>
            <span>Available balance</span>
            <strong>
              {formatCurrency(selectedWalletBalance, selectedWallet.currency)}
            </strong>
          </div>

          {amountNumber > 0 && (
            <p
              className={
                isAmountTooHigh
                  ? "form-warning full-width"
                  : "form-helper full-width"
              }
            >
              {isAmountTooHigh
                ? "You cannot transfer more than your available balance."
                : `Estimated balance after transfer: ${formatCurrency(
                    remainingBalance,
                    selectedWallet.currency
                  )}`}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-field">
          <label>Source wallet</label>

          <select
            value={effectiveSourceWalletId}
            onChange={(e) => handleSourceWalletChange(e.target.value)}
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
          <label>Currency</label>

          <input type="text" value={effectiveCurrency} readOnly />
        </div>

        <div className="form-field full-width">
          <label>Destination wallet ID</label>

          <input
            type="text"
            placeholder="Paste destination wallet ID"
            value={destinationWalletId}
            onChange={(e) => setDestinationWalletId(e.target.value)}
            required
          />

          <small className="form-helper">
            Use the Copy ID button from another wallet and paste it here.
          </small>
        </div>

        <div className="form-field">
          <label>Amount</label>

          <input
            type="number"
            step="0.01"
            placeholder="Example: 30"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          {amount && isAmountTooHigh && (
            <small className="form-warning">
              Amount exceeds your available balance.
            </small>
          )}
        </div>

        <div className="form-field">
          <label>Description</label>

          <input
            type="text"
            placeholder="Optional transfer note"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-actions full-width">
          <button
            type="submit"
            disabled={isSubmitting || isAmountTooHigh || wallets.length === 0}
          >
            {isSubmitting ? "Transferring..." : "Transfer Funds"}
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default TransferWalletForm;
