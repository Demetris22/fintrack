import { useState } from "react";
import { createTransaction } from "../services/api";
import { categoryOptions } from "../utils/categoryStyles";

function CreateTransactionForm({ userId, accounts, onTransactionCreated }) {
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [error, setError] = useState("");

  const accountExists = accounts.some((account) => account.id === accountId);
  const effectiveAccountId =
    accountExists || accounts.length === 0 ? accountId : accounts[0].id;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!effectiveAccountId) {
      setError("Please select an account.");
      return;
    }

    if (!category) {
      setError("Please select a category.");
      return;
    }

    try {
      const transaction = await createTransaction({
        userId,
        accountId: effectiveAccountId,
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
    <div className="card form-card">
      <div className="form-card-header">
        <h2>Create Transaction</h2>
        <p>Add a new expense and assign it to a category.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-field">
          <label>Account</label>
          <select
            value={effectiveAccountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} - {account.accountType}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Amount</label>
          <input
            type="number"
            step="0.01"
            placeholder="Example: 25.50"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>Merchant</label>
          <input
            type="text"
            placeholder="Example: Starbucks, Lidl, Gym"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select category</option>

            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field full-width">
          <label>Description</label>
          <input
            type="text"
            placeholder="Optional note about this transaction"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>Transaction date</label>
          <input
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            required
          />
        </div>

        <div className="form-actions full-width">
          <button type="submit">Create Transaction</button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default CreateTransactionForm;
