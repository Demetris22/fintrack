import { useCallback, useEffect, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
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
import EmptyState from "./EmptyState";
import { Button, Card } from "./ui";

function AnalyticsPanel({ userId, transactions }) {
  const [breakdown, setBreakdown] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const data = await getSpendingByCategory(userId);
      const nextBreakdown = Array.isArray(data?.breakdown)
        ? data.breakdown
        : [];

      const sortedBreakdown = [...nextBreakdown].sort(
        (a, b) => Number(b.total) - Number(a.total)
      );

      setBreakdown(sortedBreakdown);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      loadAnalytics();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadAnalytics, transactions.length, userId]);

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
    <Card className="analytics-card">
      <div className="analytics-header">
        <p>Automatically updated from your transactions</p>

        <Button type="button" onClick={loadAnalytics} isLoading={isLoading}>
          {!isLoading && <RefreshCw size={16} strokeWidth={1.9} aria-hidden="true" />}
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {error && <p className="error">{error}</p>}

      {breakdown.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No analytics available yet"
          description="Add transactions with categories to generate spending insights."
        />
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
                <YAxis tickFormatter={(value) => `EUR ${value}`} />
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
    </Card>
  );
}

export default AnalyticsPanel;
