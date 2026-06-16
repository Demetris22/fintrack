import { useState } from "react";
import { getSpendingByCategory } from "../services/api";

function AnalyticsPanel({ userId }) {
  const [breakdown, setBreakdown] = useState([]);
  const [error, setError] = useState("");

  async function handleLoadAnalytics() {
    setError("");

    try {
      const data = await getSpendingByCategory(userId);
      setBreakdown(data.breakdown);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card">
      <h2>Analytics</h2>

      <button onClick={handleLoadAnalytics}>Load Spending Analytics</button>

      {error && <p className="error">{error}</p>}

      {breakdown.length === 0 ? (
        <p>No analytics loaded yet.</p>
      ) : (
        <ul>
          {breakdown.map((item) => (
            <li key={item.category || "uncategorized"}>
              {item.category || "Uncategorized"} - €{item.total}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AnalyticsPanel;