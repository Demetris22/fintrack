import { useState } from "react";
import { createAccount } from "../services/api";
import { Button, FormCard, FormField, SelectInput, TextInput } from "./ui";

function CreateAccountForm({ userId, onAccountCreated }) {
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [accountType, setAccountType] = useState("Wallet");
  const [currency, setCurrency] = useState("EUR");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const account = await createAccount({
        userId,
        name,
        institution,
        accountType,
        currency,
      });

      onAccountCreated(account);

      setName("");
      setInstitution("");
      setAccountType("Wallet");
      setCurrency("EUR");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormCard
      title="Create Account"
      description="Add a wallet, bank account, savings account, or card."
    >
      <form onSubmit={handleSubmit} className="form-grid">
        <FormField label="Account name">
          <TextInput
            type="text"
            placeholder="Example: Main Wallet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Institution">
          <TextInput
            type="text"
            placeholder="Example: Revolut, Hellenic Bank"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
        </FormField>

        <FormField label="Account type">
          <SelectInput
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
          >
            <option value="Wallet">Wallet</option>
            <option value="Bank">Bank</option>
            <option value="Savings">Savings</option>
            <option value="Card">Card</option>
          </SelectInput>
        </FormField>

        <FormField label="Currency">
          <SelectInput value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </SelectInput>
        </FormField>

        <div className="form-actions full-width">
          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create Account"}
          </Button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
    </FormCard>
  );
}

export default CreateAccountForm;
