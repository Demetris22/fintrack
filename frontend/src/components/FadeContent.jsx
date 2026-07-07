import AnimatedContent from "./AnimatedContent";

function FadeContent({ children, className = "", delay = 0, ...props }) {
  return (
    <AnimatedContent
      className={`section-entrance ${className}`.trim()}
      distance={34}
      duration={0.82}
      ease="power3.out"
      initialOpacity={0}
      scale={0.985}
      threshold={0.16}
      delay={delay}
      {...props}
    >
      {children}
    </AnimatedContent>
  );
}

export default FadeContent;
