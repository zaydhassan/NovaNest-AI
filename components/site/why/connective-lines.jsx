"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * ConnectiveLines — the connective tissue of the "Why NovaNest" grid:
 * very thin curved trajectories weaving across the six cards with tiny
 * glowing nodes where they meet. Decorative only; masked so it fades
 * before the edges, drawn progressively on first view (skipped entirely
 * under prefers-reduced-motion).
 */
const PATHS = [
  {
    d: "M-40 130 C 220 60, 430 210, 620 150 S 1030 70, 1240 150",
    stroke: "hsl(var(--primary) / 0.09)",
    delay: 0,
  },
  {
    d: "M-40 460 C 260 380, 470 540, 740 440 S 1080 370, 1240 440",
    stroke: "hsl(var(--accent) / 0.07)",
    delay: 0.25,
  },
  {
    d: "M320 -20 C 320 120, 250 180, 240 330",
    stroke: "hsl(var(--foreground) / 0.06)",
    delay: 0.4,
  },
  {
    d: "M905 660 C 905 520, 1000 480, 1030 350",
    stroke: "hsl(var(--foreground) / 0.06)",
    delay: 0.55,
  },
];

const NODES = [
  { cx: 620, cy: 150, fill: "hsl(var(--accent) / 0.45)" },
  { cx: 240, cy: 330, fill: "hsl(var(--primary) / 0.4)" },
  { cx: 740, cy: 440, fill: "hsl(var(--accent) / 0.35)" },
  { cx: 1030, cy: 350, fill: "hsl(var(--foreground) / 0.22)" },
];

export function ConnectiveLines({ className }) {
  const reduced = useReducedMotion();

  return (
    <svg
      className={className}
      viewBox="0 0 1200 640"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" strokeWidth="1">
        {PATHS.map((p) =>
          reduced ? (
            <path key={p.d} d={p.d} stroke={p.stroke} />
          ) : (
            <motion.path
              key={p.d}
              d={p.d}
              stroke={p.stroke}
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1.8, delay: p.delay, ease: "easeOut" }}
            />
          )
        )}
      </g>
      <g>
        {NODES.map((n) => (
          <circle key={`${n.cx}-${n.cy}`} cx={n.cx} cy={n.cy} r="2.5" fill={n.fill} />
        ))}
      </g>
    </svg>
  );
}

export default ConnectiveLines;