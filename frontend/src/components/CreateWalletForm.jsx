import { useState } from "react";
import { createWallet } from "../services/api";
import { Button, FormCard, FormField, SelectInput } from "./ui";

function CreateWalletForm({ onWalletCreated, onNotify }) {
  const [currency, setCurrency] = useState("EUR");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const wallet = await createWallet({
        currency,
      });

      onWalletCreated(wallet);
      setCurrency("EUR");
    } catch (err) {
      const message = err.message || "Could not create wallet.";

      setError(message);
      onNotify?.({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormCard title="Create Wallet" description="Create a wallet for a specific currency.">
      <form onSubmit={handleSubmit} className="form-grid">
        <FormField label="Currency" fullWidth>
          <SelectInput value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </SelectInput>
        </FormField>

        <div className="form-actions full-width">
          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create Wallet"}
          </Button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
    </FormCard>
  );
}

export default CreateWalletForm;
