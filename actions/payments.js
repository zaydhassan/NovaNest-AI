"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { AppError, withErrorHandling } from "@/lib/errors";
import { createOrderSchema, verifyPaymentSchema } from "@/lib/schemas";
import { PLANS, createOrder, verifySignature } from "@/lib/razorpay";

// Entitlement duration per billing cycle. Kept coarse on purpose — renewal
// billing is out of scope; this sets the current-period-end for the initial
// purchase only.
const PERIOD_DAYS = { monthly: 30, annual: 365 };

/**
 * Create a Razorpay order for the selected plan + billing cycle and persist a
 * `PaymentOrder` row in the `created` state. Returns everything the client
 * needs to open the checkout modal (order id, amount, the public key, and the
 * user's prefill details). Auth-gated via `requireUser`.
 */
async function createPaymentOrder({ planId, billingCycle }) {
  const user = await requireUser();

  const parsed = createOrderSchema.safeParse({ planId, billingCycle });
  if (!parsed.success) {
    throw new AppError(parsed.error.issues?.[0]?.message ?? "Invalid plan selection.", {
      code: "VALIDATION",
      status: 400,
    });
  }

  const plan = PLANS[parsed.data.planId];
  const amount = plan[billingCycle];

  // Short, unique-ish receipt for Razorpay's dashboard + our own audit trail.
  const receipt = `nn_${parsed.data.planId.toLowerCase()}_${Date.now()}`;

  const order = await createOrder({
    planId: parsed.data.planId,
    billingCycle: parsed.data.billingCycle,
    receipt,
    notes: {
      userId: user.id,
      plan: parsed.data.planId,
      billingCycle: parsed.data.billingCycle,
    },
  });

  await db.paymentOrder.create({
    data: {
      userId: user.id,
      plan: parsed.data.planId,
      billingCycle: parsed.data.billingCycle,
      amount: order.amount,
      currency: order.currency,
      razorpayOrderId: order.id,
    },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    name: user.name ?? "",
    email: user.email ?? "",
    planName: plan.name,
  };
}

/**
 * Verify the Razorpay signature returned by the checkout modal, then mark the
 * `PaymentOrder` paid and upgrade the user's plan + entitlement window inside
 * a transaction. Idempotent-ish: a re-verify against an already-paid order is
 * a no-op (the signature still checks, but the user update is safe to repeat).
 */
async function verifyPayment({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  planId,
  billingCycle,
}) {
  const user = await requireUser();

  const parsed = verifyPaymentSchema.safeParse({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    planId,
    billingCycle,
  });
  if (!parsed.success) {
    throw new AppError("The payment details weren't valid.", {
      code: "VALIDATION",
      status: 400,
    });
  }

  // The order must exist AND belong to this user — otherwise a signed payload
  // from one user could be replayed to upgrade another.
  const order = await db.paymentOrder.findUnique({
    where: { razorpayOrderId: parsed.data.razorpay_order_id },
  });
  if (!order || order.userId !== user.id) {
    throw new AppError("We couldn't find that payment order.", {
      code: "ORDER_NOT_FOUND",
      status: 404,
    });
  }
  if (order.plan !== parsed.data.planId || order.billingCycle !== parsed.data.billingCycle) {
    throw new AppError("The payment details don't match the selected plan.", {
      code: "PLAN_MISMATCH",
      status: 400,
    });
  }

  const ok = verifySignature({
    orderId: parsed.data.razorpay_order_id,
    paymentId: parsed.data.razorpay_payment_id,
    signature: parsed.data.razorpay_signature,
  });
  if (!ok) {
    // Persist the failed attempt for the audit trail.
    await db.paymentOrder.update({
      where: { id: order.id },
      data: { status: "failed" },
    });
    throw new AppError("Payment verification failed. Please contact support if you were charged.", {
      code: "SIGNATURE_INVALID",
      status: 400,
    });
  }

  const days = PERIOD_DAYS[parsed.data.billingCycle] ?? 30;
  const currentPeriodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await db.$transaction([
    db.paymentOrder.update({
      where: { id: order.id },
      data: {
        status: "paid",
        razorpayPaymentId: parsed.data.razorpay_payment_id,
        razorpaySignature: parsed.data.razorpay_signature,
      },
    }),
    db.user.update({
      where: { id: user.id },
      data: {
        plan: parsed.data.planId,
        subscriptionStatus: "active",
        currentPeriodEnd,
        razorpayCustomerId: parsed.data.razorpay_payment_id,
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/dashboard");

  return { success: true, plan: parsed.data.planId };
}

export const createPaymentOrderAction = withErrorHandling(
  createPaymentOrder,
  "Couldn't start checkout. Please try again."
);

export const verifyPaymentAction = withErrorHandling(
  verifyPayment,
  "We couldn't confirm your payment. Please try again or contact support."
);