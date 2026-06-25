import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { getSpendingByCategory } from "../services/api";
import { getCategoryStyle } from "../utils/categoryStyles";

function AnalyticsPanel({ userId, transactions }) {
  const [breakdown, setBreakdown] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      return;
    }

    loadAnalytics();
  }, [userId, transactions.length]);

  async function loadAnalytics() {
    setError("");
    setIsLoading(true);

    try {
      const data = await getSpendingByCategory(userId);

      const sortedBreakdown = [...data.breakdown].sort(
        (a, b) => Number(b.total) - Number(a.total)
      );

      setBreakdown(sortedBreakdown);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-CY", {
      style: "currency",
      currency: "EUR",
    }).format(Number(amount));
  }

  const totalSpending = breakdown.reduce(
    (sum, item) => sum + Number(item.total),
    0
  );

  return (
    <div className="card analytics-card">
      <div className="analytics-header">
  <p>Automatically updated from your transactions</p>

  <button type="button" onClick={loadAnalytics}>
    {isLoading ? "Loading..." : "Refresh"}
  </button>
</div>

      {error && <p className="error">{error}</p>}

      {breakdown.length === 0 ? (
        <div className="empty-state">
          <h3>No analytics available yet</h3>
          <p>Add transactions with categories to generate spending insights.</p>
        </div>
      ) : (
        <>
          <div className="analytics-summary">
            <h3>Total Spending</h3>
            <p>{formatCurrency(totalSpending)}</p>
          </div>

          <div className="chart-container">
            <h3 className="chart-title">Spending by Category</h3>
            <p className="chart-subtitle">
              Total transaction amount grouped by category
            </p>

            <ResponsiveContainer width="100%" height={290}>
              <BarChart
                data={breakdown}
                margin={{ top: 20, right: 20, left: 20, bottom: 45 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 14 }}
                  interval={0}
                />
                <YAxis tickFormatter={(value) => `€${value}`} />
                <Tooltip formatter={(value) => [formatCurrency(value), "Total"]} />

                <Bar dataKey="total" radius={[10, 10, 0, 0]} maxBarSize={95}>
                  {breakdown.map((item, index) => (
                    <Cell
                      key={`cell-${item.category || index}`}
                      fill={getCategoryStyle(item.category).color}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="category-breakdown">
            <h3>Category Breakdown</h3>

            <div className="data-list">
              {breakdown.map((item, index) => {
                const categoryStyle = getCategoryStyle(item.category);

                return (
                  <div
                    className="data-row category-row"
                    key={item.category || index}
                  >
                    <div className="row-title">
                      <span
                        className="category-icon"
                        style={{
                          backgroundColor: categoryStyle.background,
                          color: categoryStyle.color,
                        }}
                      >
                        {categoryStyle.icon}
                      </span>

                      <h3>{item.category || "Uncategorized"}</h3>
                    </div>

                    <strong>{formatCurrency(item.total)}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AnalyticsPanel;