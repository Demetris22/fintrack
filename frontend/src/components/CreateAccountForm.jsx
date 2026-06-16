import { useState } from "react";
import { createAccount } from "../services/api";

function CreateAccountForm({ userId, onAccountCreated }) {
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [accountType, setAccountType] = useState("Wallet");
  const [currency, setCurrency] = useState("EUR");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

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
    }
  }

  return (
    <div className="card">
      <h2>Create Account</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Account name e.g. Main Wallet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Institution e.g. FinTrack"
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
        />

        <select
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
        >
          <option value="Wallet">Wallet</option>
          <option value="Bank">Bank</option>
          <option value="Savings">Savings</option>
          <option value="Card">Card</option>
        </select>

        <input
          type="text"
          placeholder="Currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          required
        />

        <button type="submit">Create Account</button>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default CreateAccountForm;