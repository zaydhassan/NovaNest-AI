import { ShieldCheck, Lock } from "lucide-react";

/**
 * PrivacyVisual — premium privacy visualization for Card 06: a shield
 * with a lock badge inside a slow dashed orbit (rotating only on hover),
 * framed by three tiny trust labels. Elegant and restrained.
 */
const LABELS = [
  { text: "Encrypted", className: "right-2 top-2" },
  { text: "Your data", className: "left-1.5 top-1/2 -translate-y-1/2" },
  { text: "Always yours", className: "bottom-2 left-1/2 -translate-x-1/2" },
];

export function PrivacyVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center p-3">
      {/* Orbit ring with two nodes — rotates gently on hover */}
      <div className="absolute h-[104px] w-[104px] rounded-full border border-dashed border-white/[0.12] group-hover:animate-spin-slow">
        <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/70" />
        <span className="absolute bottom-[12%] right-[8%] h-1 w-1 rounded-full bg-primary/70" />
      </div>

      {/* Shield + lock */}
      <div className="relative grid h-11 w-11 place-items-center rounded-2xl border border-accent/25 bg-accent/10 text-accent shadow-[0_0_26px_-8px_hsl(var(--accent)/0.6)] transition-transform duration-500 ease-spring group-hover:scale-105">
        <ShieldCheck className="h-5 w-5" />
        <span className="absolute -bottom-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full border border-white/15 bg-[#14161C] text-white/80">
          <Lock className="h-2.5 w-2.5" />
        </span>
      </div>

      {/* Trust labels */}
      {LABELS.map((label) => (
        <span
          key={label.text}
          className={`absolute rounded-full border border-white/[0.07] bg-white/[0.04] px-1.5 py-0.5 text-[8px] tracking-wide text-white/50 transition-colors duration-500 group-hover:text-white/70 ${label.className}`}
        >
          {label.text}
        </span>
      ))}
    </div>
  );
}

export default PrivacyVisual;