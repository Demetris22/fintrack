import { useState } from "react";
import { transferBetweenWallets } from "../services/api";
import { Button, FormCard, FormField, SelectInput, TextInput } from "./ui";

function TransferWalletForm({ wallets, onTransferCompleted, onNotify }) {
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
  const isAmountInvalid = amount.trim() !== "" && amountNumber <= 0;
  const isAmountTooHigh = amountNumber > selectedWalletBalance;
  const trimmedDestinationWalletId = destinationWalletId.trim();
  const isSameWallet =
    Boolean(trimmedDestinationWalletId) &&
    effectiveSourceWalletId === trimmedDestinationWalletId;
  const remainingBalance = selectedWalletBalance - amountNumber;
  const effectiveCurrency = selectedWallet?.currency || currency || "EUR";
  const isTransferReady =
    Boolean(effectiveSourceWalletId) &&
    Boolean(trimmedDestinationWalletId) &&
    amountNumber > 0 &&
    !isAmountInvalid &&
    !isAmountTooHigh &&
    !isSameWallet &&
    wallets.length > 0;

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

  function shortenWalletId(walletId) {
    if (!walletId) {
      return "Destination wallet";
    }

    if (walletId.length <= 14) {
      return walletId;
    }

    return `${walletId.slice(0, 6)}…${walletId.slice(-6)}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");

    if (!effectiveSourceWalletId) {
      setError("Please select a source wallet.");
      return;
    }

    if (!trimmedDestinationWalletId) {
      setError("Please enter a destination wallet ID.");
      return;
    }

    if (isSameWallet) {
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
        await onTransferCompleted({
          sourceWalletId: effectiveSourceWalletId,
          destinationWalletId: trimmedDestinationWalletId,
        });
      }
    } catch (err) {
      const message = err.message || "Could not complete transfer.";

      setError(message);
      onNotify?.({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormCard
      title="Transfer Funds"
      description="Move money from one wallet to another wallet securely."
    >
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
        <FormField label="Source wallet">
          <SelectInput
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
          </SelectInput>
        </FormField>

        <FormField label="Currency">
          <TextInput type="text" value={effectiveCurrency} readOnly />
        </FormField>

        <FormField label="Destination wallet ID" fullWidth>
          <TextInput
            type="text"
            placeholder="Paste destination wallet ID"
            value={destinationWalletId}
            onChange={(e) => setDestinationWalletId(e.target.value)}
            required
          />

          <small className="form-helper">
            Use the Copy ID button from another wallet and paste it here.
          </small>

          {isSameWallet && (
            <small className="form-warning">
              Source and destination wallets cannot be the same.
            </small>
          )}
        </FormField>

        <FormField label="Amount">
          <TextInput
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

          {isAmountInvalid && (
            <small className="form-warning">
              Amount must be greater than 0.
            </small>
          )}
        </FormField>

        <FormField label="Description">
          <TextInput
            type="text"
            placeholder="Optional transfer note"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>

        {(trimmedDestinationWalletId || amountNumber > 0 || description) && (
          <div
            className={
              isAmountTooHigh || isSameWallet
                ? "transfer-summary-card warning full-width"
                : "transfer-summary-card full-width"
            }
          >
            <div>
              <span>From</span>
              <strong>{selectedWallet?.currency || effectiveCurrency} Wallet</strong>
            </div>

            <div>
              <span>To</span>
              <strong>{shortenWalletId(trimmedDestinationWalletId)}</strong>
            </div>

            <div>
              <span>Amount</span>
              <strong>{formatCurrency(amountNumber, effectiveCurrency)}</strong>
            </div>

            {description && (
              <p className="full-width">{description}</p>
            )}
          </div>
        )}

        <div className="form-actions full-width">
          <Button
            type="submit"
            className={isTransferReady ? "submit-ready" : ""}
            disabled={isSubmitting || !isTransferReady}
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Transferring…" : "Transfer Funds"}
          </Button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
    </FormCard>
  );
}

export default TransferWalletForm;
