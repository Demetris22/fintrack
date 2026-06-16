import { useState } from "react";
import { createTransaction } from "../services/api";

function CreateTransactionForm({ userId, accounts, onTransactionCreated }) {
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (!accountId) {
      setError("Please select an account first.");
      return;
    }

    try {
      const transaction = await createTransaction({
        userId,
        accountId,
        amount: Number(amount),
        currency: "EUR",
        merchant,
        category,
        description,
        transactionDate,
      });

      onTransactionCreated(transaction);

      setAmount("");
      setMerchant("");
      setCategory("");
      setDescription("");
      setTransactionDate("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card">
      <h2>Create Transaction</h2>

      <form onSubmit={handleSubmit}>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
          <option value="">Select account</option>

          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} - {account.accountType}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.01"
          step="0.01"
          required
        />

        <input
          type="text"
          placeholder="Merchant e.g. Starbucks"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
        />

        <input
          type="text"
          placeholder="Category e.g. Food"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <input
          type="text"
          placeholder="Description e.g. Coffee"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="date"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
          required
        />

        <button type="submit">Create Transaction</button>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default CreateTransactionForm;