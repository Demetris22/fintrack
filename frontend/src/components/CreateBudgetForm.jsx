import { useState } from "react";
import { createBudget } from "../services/api";
import { categoryOptions } from "../utils/categoryStyles";
import { Button, FormCard, FormField, SelectInput, TextInput } from "./ui";

function CreateBudgetForm({ userId, onBudgetCreated }) {
  const [category, setCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!category) {
      setError("Please select a category.");
      return;
    }

    try {
      setIsSubmitting(true);

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
            step="0.01"
            placeholder="Example: 500"
            value={monthlyLimit}
            onChange={(e) => setMonthlyLimit(e.target.value)}
            required
          />
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
            {isSubmitting ? "Creating..." : "Create Budget"}
          </Button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
    </FormCard>
  );
}

export default CreateBudgetForm;
