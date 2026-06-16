import { useState } from "react";
import { createBudget } from "../services/api";

function CreateBudgetForm({ userId, onBudgetCreated }) {
  const [category, setCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    try {
      const budget = await createBudget({
        userId,
        category,
        monthlyLimit: Number(monthlyLimit),
        currency,
      });

      onBudgetCreated(budget);

      setCategory("");
      setMonthlyLimit("");
      setCurrency("EUR");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card">
      <h2>Create Budget</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Category e.g. Food"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Monthly limit"
          value={monthlyLimit}
          onChange={(e) => setMonthlyLimit(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          required
        />

        <button type="submit">Create Budget</button>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
export default CreateBudgetForm;