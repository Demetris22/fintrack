import { useMotionValue, useSpring } from "motion/react";
import { useCallback, useEffect, useMemo, useRef } from "react";

function getDecimalPlaces(num) {
  const str = num.toString();

  if (str.includes(".")) {
    const decimals = str.split(".")[1];

    if (parseInt(decimals, 10) !== 0) {
      return decimals.length;
    }
  }

  return 0;
}

export default function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  className = "",
  startWhen = true,
  separator = "",
  decimalPlaces,
  onStart,
  onEnd,
}) {
  const ref = useRef(null);
  const hasCompletedRef = useRef(false);
  const motionValue = useMotionValue(direction === "down" ? to : from);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);

  const springValue = useSpring(motionValue, {
    damping,
    stiffness,
  });

  const maxDecimals = useMemo(
    () =>
      typeof decimalPlaces === "number"
        ? decimalPlaces
        : Math.max(getDecimalPlaces(from), getDecimalPlaces(to)),
    [decimalPlaces, from, to]
  );

  const formatValue = useCallback(
    (latest) => {
      const hasDecimals = maxDecimals > 0;

      const options = {
        useGrouping: Boolean(separator),
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0,
      };

      const formattedNumber = Intl.NumberFormat("en-US", options).format(
        latest
      );

      return separator
        ? formattedNumber.replace(/,/g, separator)
        : formattedNumber;
    },
    [maxDecimals, separator]
  );

  useEffect(() => {
    hasCompletedRef.current = false;

    if (ref.current) {
      ref.current.textContent = formatValue(direction === "down" ? to : from);
    }
  }, [from, to, direction, formatValue]);

  useEffect(() => {
    if (!ref.current || !startWhen) {
      return undefined;
    }

    if (typeof onStart === "function") {
      onStart();
    }

    const targetValue = direction === "down" ? from : to;

    const timeoutId = window.setTimeout(() => {
      motionValue.set(targetValue);
    }, delay * 1000);

    const durationTimeoutId = window.setTimeout(() => {
      hasCompletedRef.current = true;

      if (ref.current) {
        ref.current.textContent = formatValue(targetValue);
      }

      if (typeof onEnd === "function") {
        onEnd();
      }
    }, delay * 1000 + duration * 1000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearTimeout(durationTimeoutId);
    };
  }, [
    startWhen,
    motionValue,
    direction,
    from,
    to,
    delay,
    onStart,
    onEnd,
    duration,
    formatValue,
  ]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current && !hasCompletedRef.current) {
        ref.current.textContent = formatValue(latest);
      }
    });

    return () => unsubscribe();
  }, [springValue, formatValue]);

  return (
    <span className={className} ref={ref}>
      {formatValue(direction === "down" ? to : from)}
    </span>
  );
}
