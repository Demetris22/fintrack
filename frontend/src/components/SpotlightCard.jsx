import { useRef } from "react";
import "./SpotlightCard.css";

function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(36, 88, 211, 0.14)",
  as: Component = "div",
  ...props
}) {
  const divRef = useRef(null);

  const handleMouseMove = (event) => {
    if (!divRef.current) {
      return;
    }

    const rect = divRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    divRef.current.style.setProperty("--mouse-x", `${x}px`);
    divRef.current.style.setProperty("--mouse-y", `${y}px`);
    divRef.current.style.setProperty("--spotlight-color", spotlightColor);
  };

  return (
    <Component
      ref={divRef}
      onMouseMove={handleMouseMove}
      className={`card-spotlight ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}

export default SpotlightCard;
