"use client";

import Link from "next/link";
import { Sparkles, Crown, CalendarClock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckoutButton } from "@/components/site/checkout-button";
import { plans, CURRENCY_SYMBOL } from "@/data/pricing";

const PLAN_LABEL = { STARTER: "Free", PRO: "Pro", TEAMS: "Teams" };

export default function PlanStatusCard({ plan = "STARTER", subscriptionStatus, currentPeriodEnd }) {
  const isPaid = plan === "PRO" || plan === "TEAMS";
  const proPlan = plans.find((p) => p.id === "PRO");
  const symbol = CURRENCY_SYMBOL[proPlan?.currency] ?? "₹";

  return (
    <Card className="glass overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isPaid ? (
            <span className="grid h-7 w-7 place-items-center rounded-full cta-gradient text-white">
              <Crown className="h-4 w-4" />
            </span>
          ) : (
            <span className="grid h-7 w-7 place-items-center rounded-full ring-aurora text-white">
              <Sparkles className="h-4 w-4" />
            </span>
          )}
          Your plan
        </CardTitle>
        <CardDescription>
          {isPaid
            ? "Your subscription is active."
            : "You're on the free plan. Upgrade for the full AI workspace."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={
              isPaid
                ? "inline-flex items-center gap-1.5 rounded-full cta-gradient px-3 py-1 text-sm font-semibold text-white"
                : "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-sm font-semibold text-muted-foreground"
            }
          >
            {PLAN_LABEL[plan] ?? "Free"}
          </span>
          {isPaid && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {subscriptionStatus === "active" ? "Active" : subscriptionStatus ?? "Active"}
            </span>
          )}
        </div>

        {isPaid ? (
          currentPeriodEnd ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              Renews or expires on {format(new Date(currentPeriodEnd), "dd MMM yyyy")}
            </p>
          ) : null
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <CheckoutButton
              plan={proPlan}
              billingCycle="monthly"
              variant="gradient"
              size="lg"
              className="rounded-full px-6 font-semibold"
            >
              <Crown className="h-4 w-4" />
              Upgrade to Pro · {symbol}
              {proPlan.price.toLocaleString("en-IN")}/mo
            </CheckoutButton>
            <Link href="/#pricing" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Compare plans
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}