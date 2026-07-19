"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1];

/**
 * Pricing — three-tier plan grid with a monthly/annual toggle. The middle
 * plan is highlighted with the reserved accent gradient ring.
 */
export function Pricing({ plans }) {
  const [annual, setAnnual] = useState(true);

  return (
    <div>
      {/* Billing toggle */}
      <div className="mb-10 flex items-center justify-center gap-3">
        <span className={cn("text-sm", !annual ? "text-foreground" : "text-muted-foreground")}>
          Monthly
        </span>
        <button
          onClick={() => setAnnual((v) => !v)}
          className="relative h-7 w-12 rounded-full border border-white/10 bg-white/[0.06] transition-colors"
          aria-pressed={annual}
          aria-label="Toggle annual billing"
        >
          <motion.span
            className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full ring-aurora"
            animate={{ left: annual ? "calc(100% - 22px)" : "2px" }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
          />
        </button>
        <span className={cn("text-sm", annual ? "text-foreground" : "text-muted-foreground")}>
          Annual <span className="text-accent-warm">· save 20%</span>
        </span>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan, i) => {
          const price = annual ? Math.round(plan.price * 12 * 0.8) : plan.price;
          const period = annual ? "/yr" : plan.period;
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
              className={cn(
                "relative rounded-2xl p-6",
                plan.highlighted
                  ? "border-gradient shadow-glass-lg"
                  : "glass hover:-translate-y-1 hover:shadow-glass-lg"
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full cta-gradient px-3 py-1 text-xs font-semibold text-white shadow-glow">
                  <Sparkles className="h-3 w-3" /> Most popular
                </span>
              )}
              <div className={plan.highlighted ? "rounded-[calc(var(--radius-2xl)-1px)] p-5" : ""}>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 min-h-[40px] text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">${price}</span>
                  <span className="mb-1 text-sm text-muted-foreground">{period}</span>
                </div>

                <Link href={plan.href} className="mt-6 block">
                  <Button
                    variant={plan.highlighted ? "gradient" : "outline"}
                    className="w-full rounded-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/85">
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ring-aurora">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default Pricing;