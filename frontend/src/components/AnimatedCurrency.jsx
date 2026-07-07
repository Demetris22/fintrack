import { useReducedMotion } from "motion/react";
import CountUp from "./CountUp";

function getCurrencyParts(amount, currency) {
  const safeCurrency = currency || "EUR";
  const absoluteAmount = Math.abs(Number(amount || 0));

  try {
    const parts = new Intl.NumberFormat("en-CY", {
      style: "currency",
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).formatToParts(absoluteAmount);

    const firstNumberPartIndex = parts.findIndex(
      (part) => part.type === "integer"
    );
    const lastNumberPartIndex = parts.findLastIndex(
      (part) =>
        part.type === "integer" ||
        part.type === "group" ||
        part.type === "decimal" ||
        part.type === "fraction"
    );

    return {
      prefix: parts
        .slice(0, firstNumberPartIndex)
        .map((part) => part.value)
        .join(""),
      suffix: parts
        .slice(lastNumberPartIndex + 1)
        .map((part) => part.value)
        .join(""),
      value: absoluteAmount,
      currency: safeCurrency,
    };
  } catch {
    return {
      prefix: "",
      suffix: ` ${safeCurrency}`,
      value: absoluteAmount,
      currency: safeCurrency,
    };
  }
}

function formatCurrency(amount, currency) {
  const safeCurrency = currency || "EUR";

  try {
    return new Intl.NumberFormat("en-CY", {
      style: "currency",
      currency: safeCurrency,
    }).format(Number(amount || 0));
  } catch {
    return `${Number(amount || 0).toFixed(2)} ${safeCurrency}`;
  }
}

function AnimatedCurrency({
  amount,
  currency = "EUR",
  className = "",
  duration = 0.75,
}) {
  const shouldReduceMotion = useReducedMotion();
  const numericAmount = Number(amount || 0);
  const isNegative = numericAmount < 0;
  const parts = getCurrencyParts(numericAmount, currency);

  if (shouldReduceMotion) {
    return (
      <span className={className}>{formatCurrency(numericAmount, currency)}</span>
    );
  }

  return (
    <span className={className}>
      {isNegative && <span>-</span>}
      {parts.prefix && <span>{parts.prefix}</span>}
      <CountUp
        from={0}
        to={parts.value}
        separator=","
        decimalPlaces={2}
        duration={duration}
        className="count-up-number"
      />
      {parts.suffix && <span>{parts.suffix}</span>}
    </span>
  );
}

export default AnimatedCurrency;
