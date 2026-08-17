export function AuroraBackground({ className = "" }) {
  return (
    <div className="aurora-bg" aria-hidden="true">
      <div
        className="aurora-blob"
        style={{
          width: 620,
          height: 620,
          top: -200,
          left: "-12%",
          background: "hsl(var(--primary))",
          opacity: 0.16,
          animation: "floaty 9s ease-in-out infinite",
        }}
      />
      <div
        className="aurora-blob"
        style={{
          width: 560,
          height: 560,
          top: -160,
          right: "-10%",
          background: "hsl(var(--cyan))",
          opacity: 0.14,
          animation: "floaty 11s ease-in-out infinite reverse",
        }}
      />
      <div className="absolute inset-0 grid-mesh" />
    </div>
  );
}

export default AuroraBackground;