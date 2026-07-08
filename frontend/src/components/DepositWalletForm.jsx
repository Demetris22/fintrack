import { useState } from "react";
import { depositToWallet } from "../services/api";
import { Button, FormCard, FormField, SelectInput, TextInput } from "./ui";

function DepositWalletForm({ wallets, onDepositCompleted, onNotify }) {
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
  const amountNumber = Number(amount || 0);
  const projectedBalance = selectedWalletBalance + amountNumber;
  const hasAmount = amount.trim() !== "";
  const isAmountInvalid = hasAmount && amountNumber <= 0;
  const canSubmit = Boolean(effectiveWalletId) && amountNumber > 0;

  function formatCurrency(value, currency = "EUR") {
    return new Intl.NumberFormat("en-CY", {
      style: "currency",
      currency,
    }).format(Number(value || 0));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

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

      await depositToWallet(effectiveWalletId, amountNumber);

      setAmount("");

      if (onDepositCompleted) {
        await onDepositCompleted(effectiveWalletId);
      }
    } catch (err) {
      const message = err.message || "Could not complete deposit.";

      setError(message);
      onNotify?.({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormCard
      title="Deposit to Wallet"
      description="Add funds to one of your existing wallets."
    >
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
        <FormField label="Wallet">
          <SelectInput
            name="deposit-wallet"
            autoComplete="off"
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
          </SelectInput>
        </FormField>

        <FormField label="Amount">
          <TextInput
            type="number"
            name="deposit-amount"
            autoComplete="off"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="100..."
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          {isAmountInvalid && (
            <small className="form-warning">
              Amount must be greater than 0.
            </small>
          )}
        </FormField>

        {selectedWallet && amountNumber > 0 && (
          <div className="deposit-preview-card full-width">
            <div>
              <span>Deposit amount</span>
              <strong>{formatCurrency(amountNumber, selectedWallet.currency)}</strong>
            </div>

            <div>
              <span>Projected balance</span>
              <strong>{formatCurrency(projectedBalance, selectedWallet.currency)}</strong>
            </div>
          </div>
        )}

        <div className="form-actions full-width">
          <Button
            type="submit"
            className={canSubmit ? "submit-ready" : ""}
            disabled={isSubmitting || !canSubmit}
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Depositing..." : "Deposit"}
          </Button>
        </div>
      </form>

      {error && <p className="error" role="alert">{error}</p>}
    </FormCard>
  );
}

export default DepositWalletForm;
