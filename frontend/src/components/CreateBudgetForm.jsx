import { useState } from "react";
import { createBudget } from "../services/api";
import { categoryOptions } from "../utils/categoryStyles";
import { Button, FormCard, FormField, SelectInput, TextInput } from "./ui";

function CreateBudgetForm({ userId, onBudgetCreated, onNotify }) {
  const [category, setCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");

    if (!category) {
      setError("Please select a category.");
      return;
    }

    const monthlyLimitNumber = Number(monthlyLimit);

    if (monthlyLimitNumber <= 0) {
      setError("Monthly limit must be greater than 0.");
      return;
    }

    try {
      setIsSubmitting(true);

      const budget = await createBudget({
        userId,
        category,
        monthlyLimit: monthlyLimitNumber,
        currency,
      });

      onBudgetCreated(budget);

      setCategory("");
      setMonthlyLimit("");
      setCurrency("EUR");
    } catch (err) {
      const message = err.message || "Could not create budget.";

      setError(message);
      onNotify?.({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormCard
      title="Create Budget"
      description="Set a monthly spending limit for a category."
    >
      <form onSubmit={handleSubmit} className="form-grid">
        <FormField label="Category">
          <SelectInput
            name="budget-category"
            autoComplete="off"
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
          </SelectInput>
        </FormField>

        <FormField label="Monthly limit">
          <TextInput
            type="number"
            name="monthly-limit"
            autoComplete="off"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="500..."
            value={monthlyLimit}
            onChange={(e) => setMonthlyLimit(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Currency">
          <SelectInput
            name="budget-currency"
            autoComplete="off"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </SelectInput>
        </FormField>

        <div className="form-actions full-width">
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={!category || Number(monthlyLimit) <= 0}
          >
            {isSubmitting ? "Creating..." : "Create Budget"}
          </Button>
        </div>
      </form>

      {error && <p className="error" role="alert">{error}</p>}
    </FormCard>
  );
}

export default CreateBudgetForm;
