import { ShieldCheck, Lock } from "lucide-react";

/**
 * PrivacyVisual — shield + lock with a subtle dashed orbit ring for the
 * Private by default card. The orbit (with its two nodes) slowly rotates
 * only while the card is hovered.
 */
export function PrivacyVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center p-4">
      {/* Orbit ring with two nodes — rotates gently on hover */}
      <div className="absolute h-[104px] w-[104px] rounded-full border border-dashed border-white/[0.14] group-hover:animate-spin-slow">
        <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/70" />
        <span className="absolute bottom-[12%] right-[8%] h-1 w-1 rounded-full bg-primary/70" />
      </div>

      {/* Shield + lock */}
      <div className="relative grid h-12 w-12 place-items-center rounded-2xl border border-accent/25 bg-accent/10 text-accent shadow-[0_0_28px_-10px_hsl(var(--accent)/0.6)]">
        <ShieldCheck className="h-5 w-5" />
        <span className="absolute -bottom-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full border border-white/15 bg-[#14161C] text-white/80">
          <Lock className="h-2.5 w-2.5" />
        </span>
      </div>

      <span className="absolute bottom-2.5 left-1/2 w-max -translate-x-1/2 text-[10px] tracking-wide text-white/45">
        Your data. Your journey.
      </span>
    </div>
  );
}

export default PrivacyVisual;