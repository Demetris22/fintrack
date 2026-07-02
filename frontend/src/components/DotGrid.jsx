import { useCallback, useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import "./DotGrid.css";

gsap.registerPlugin(InertiaPlugin);

const throttle = (func, limit) => {
  let lastCall = 0;

  return function throttledFunction(...args) {
    const now = performance.now();

    if (now - lastCall >= limit) {
      lastCall = now;
      func.apply(this, args);
    }
  };
};

function hexToRgb(hex) {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);

  if (!match) {
    return { r: 0, g: 0, b: 0 };
  }

  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

function DotGrid({
  dotSize = 16,
  gap = 32,
  baseColor = "#5227FF",
  activeColor = "#5227FF",
  proximity = 150,
  speedTrigger = 100,
  shockRadius = 250,
  shockStrength = 5,
  maxSpeed = 5000,
  resistance = 750,
  returnDuration = 1.5,
  interactive = true,
  className = "",
  style,
}) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const dotsRef = useRef([]);
  const pointerRef = useRef({
    x: -10000,
    y: -10000,
    vx: 0,
    vy: 0,
    speed: 0,
    lastTime: 0,
    lastX: 0,
    lastY: 0,
  });

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

  const circlePath = useMemo(() => {
    if (typeof window === "undefined" || !window.Path2D) {
      return null;
    }

    const path = new window.Path2D();
    path.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
    return path;
  }, [dotSize]);

  const buildGrid = useCallback(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;

    if (!wrapper || !canvas) {
      return;
    }

    const { width, height } = wrapper.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext("2d");

    if (context) {
      context.scale(dpr, dpr);
    }

    const cell = dotSize + gap;
    const cols = Math.max(1, Math.floor((width + gap) / cell));
    const rows = Math.max(1, Math.floor((height + gap) / cell));
    const gridWidth = cell * cols - gap;
    const gridHeight = cell * rows - gap;
    const startX = (width - gridWidth) / 2 + dotSize / 2;
    const startY = (height - gridHeight) / 2 + dotSize / 2;
    const dots = [];

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        dots.push({
          cx: startX + x * cell,
          cy: startY + y * cell,
          xOffset: 0,
          yOffset: 0,
          _inertiaApplied: false,
        });
      }
    }

    dotsRef.current = dots;
  }, [dotSize, gap]);

  useEffect(() => {
    if (!circlePath) {
      return undefined;
    }

    let rafId;
    let lastDrawTime = -Infinity;
    const frameInterval = 1000 / 30;
    const proximitySquared = proximity * proximity;

    const draw = (timestamp = 0) => {
      rafId = requestAnimationFrame(draw);

      if (timestamp - lastDrawTime < frameInterval) {
        return;
      }

      lastDrawTime = timestamp;

      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);

      const { x: pointerX, y: pointerY } = pointerRef.current;

      for (const dot of dotsRef.current) {
        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;
        const dx = dot.cx - pointerX;
        const dy = dot.cy - pointerY;
        const distanceSquared = dx * dx + dy * dy;

        let fillStyle = baseColor;

        if (distanceSquared <= proximitySquared) {
          const distance = Math.sqrt(distanceSquared);
          const amount = 1 - distance / proximity;
          const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * amount);
          const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * amount);
          const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * amount);
          fillStyle = `rgb(${r},${g},${b})`;
        }

        context.save();
        context.translate(ox, oy);
        context.fillStyle = fillStyle;
        context.fill(circlePath);
        context.restore();
      }

    };

    draw();

    return () => cancelAnimationFrame(rafId);
  }, [activeRgb, baseColor, baseRgb, circlePath, proximity]);

  useEffect(() => {
    buildGrid();

    let resizeObserver = null;

    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(buildGrid);

      if (wrapperRef.current) {
        resizeObserver.observe(wrapperRef.current);
      }
    } else {
      window.addEventListener("resize", buildGrid);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", buildGrid);
      }
    };
  }, [buildGrid]);

  useEffect(() => {
    if (!interactive) {
      return undefined;
    }

    const onMove = (event) => {
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      const now = performance.now();
      const pointer = pointerRef.current;
      const dt = pointer.lastTime ? now - pointer.lastTime : 16;
      const dx = event.clientX - pointer.lastX;
      const dy = event.clientY - pointer.lastY;
      let vx = (dx / dt) * 1000;
      let vy = (dy / dt) * 1000;
      let speed = Math.hypot(vx, vy);

      if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        vx *= scale;
        vy *= scale;
        speed = maxSpeed;
      }

      pointer.lastTime = now;
      pointer.lastX = event.clientX;
      pointer.lastY = event.clientY;
      pointer.vx = vx;
      pointer.vy = vy;
      pointer.speed = speed;

      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;

      for (const dot of dotsRef.current) {
        const distance = Math.hypot(dot.cx - pointer.x, dot.cy - pointer.y);

        if (speed > speedTrigger && distance < proximity && !dot._inertiaApplied) {
          dot._inertiaApplied = true;
          gsap.killTweensOf(dot);

          const pushX = dot.cx - pointer.x + vx * 0.005;
          const pushY = dot.cy - pointer.y + vy * 0.005;

          gsap.to(dot, {
            inertia: { xOffset: pushX, yOffset: pushY, resistance },
            onComplete: () => {
              gsap.to(dot, {
                xOffset: 0,
                yOffset: 0,
                duration: returnDuration,
                ease: "elastic.out(1,0.75)",
              });
              dot._inertiaApplied = false;
            },
          });
        }
      }
    };

    const onClick = (event) => {
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;

      for (const dot of dotsRef.current) {
        const distance = Math.hypot(dot.cx - pointerX, dot.cy - pointerY);

        if (distance < shockRadius && !dot._inertiaApplied) {
          dot._inertiaApplied = true;
          gsap.killTweensOf(dot);

          const falloff = Math.max(0, 1 - distance / shockRadius);
          const pushX = (dot.cx - pointerX) * shockStrength * falloff;
          const pushY = (dot.cy - pointerY) * shockStrength * falloff;

          gsap.to(dot, {
            inertia: { xOffset: pushX, yOffset: pushY, resistance },
            onComplete: () => {
              gsap.to(dot, {
                xOffset: 0,
                yOffset: 0,
                duration: returnDuration,
                ease: "elastic.out(1,0.75)",
              });
              dot._inertiaApplied = false;
            },
          });
        }
      }
    };

    const throttledMove = throttle(onMove, 50);

    window.addEventListener("mousemove", throttledMove, { passive: true });
    window.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("mousemove", throttledMove);
      window.removeEventListener("click", onClick);
    };
  }, [
    interactive,
    maxSpeed,
    proximity,
    resistance,
    returnDuration,
    shockRadius,
    shockStrength,
    speedTrigger,
  ]);

  return (
    <section
      className={`dot-grid ${className}`.trim()}
      style={style}
      aria-hidden="true"
    >
      <div ref={wrapperRef} className="dot-grid__wrap">
        <canvas ref={canvasRef} className="dot-grid__canvas" />
      </div>
    </section>
  );
}

export default DotGrid;
