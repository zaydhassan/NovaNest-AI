/**
 * AuroraBackground — fixed, decorative ambient blobs + grid mesh.
 * Purely presentational: `aria-hidden`, `pointer-events-none`, behind content.
 */
export function AuroraBackground({ className = "" }) {
  return (
    <div className="aurora-bg" aria-hidden="true">
      <div
        className="aurora-blob"
        style={{
          width: 560,
          height: 560,
          top: -160,
          left: "-10%",
          background: "hsl(var(--primary))",
          animation: "floaty 9s ease-in-out infinite",
        }}
      />
      <div
        className="aurora-blob"
        style={{
          width: 520,
          height: 520,
          top: -120,
          right: "-8%",
          background: "hsl(var(--accent))",
          opacity: 0.42,
          animation: "floaty 11s ease-in-out infinite reverse",
        }}
      />
      <div
        className="aurora-blob"
        style={{
          width: 480,
          height: 480,
          bottom: -180,
          left: "30%",
          background: "hsl(var(--chart-2))",
          opacity: 0.35,
          animation: "floaty 13s ease-in-out infinite",
        }}
      />
      <div className="absolute inset-0 grid-mesh" />
    </div>
  );
}

export default AuroraBackground;