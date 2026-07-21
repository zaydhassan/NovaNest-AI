/**
 * Razorpay server-side integration.
 *
 * Centralizes the SDK instance, the purchasable-plan price map (amounts in
 * paise), and the two helpers the payment actions need: `createOrder` and
 * `verifySignature`. Server-only — imports `crypto` and the secret key, so
 * this file must never be pulled into a client bundle.
 */
import crypto from "crypto";
import Razorpay from "razorpay";
import { AppError } from "@/lib/errors";

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Lazily instantiate the SDK so a missing key doesn't crash module load —
// only checkout attempts surface the misconfig as a user-facing message.
let client = null;
function getClient() {
  if (!KEY_ID || !KEY_SECRET) {
    throw new AppError(
      "Payments aren't configured on the server yet. Please try again later.",
      { code: "PAYMENTS_UNCONFIGURED", status: 503 }
    );
  }
  if (!client) client = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
  return client;
}

/**
 * Purchasable plans. Amounts are in **paise** (Razorpay's smallest unit).
 * Annual = monthly × 12 × 0.8 (the 20% annual discount shown on the pricing
 * toggle). Kept here as the single source of truth the server trusts — the
 * client-sent `planId`/`billingCycle` only select from this map, never set
 * the amount, so a tampered client can't undercharge.
 */
export const PLANS = {
  PRO: {
    id: "PRO",
    name: "Pro",
    monthly: 1499 * 100, // ₹1,499
    annual: Math.round(1499 * 12 * 0.8) * 100, // ₹14,390
  },
  TEAMS: {
    id: "TEAMS",
    name: "Teams",
    monthly: 3999 * 100, // ₹3,999
    annual: Math.round(3999 * 12 * 0.8) * 100, // ₹38,390
  },
};

export function getPlanAmount(planId, billingCycle) {
  const plan = PLANS[planId];
  if (!plan) {
    throw new AppError("That plan isn't available for purchase.", {
      code: "UNKNOWN_PLAN",
      status: 400,
    });
  }
  return plan[billingCycle];
}

/**
 * Create a Razorpay order for the given plan + billing cycle. The order id
 * returned here is what the client passes into the checkout modal.
 */
export async function createOrder({ planId, billingCycle, receipt, notes }) {
  const amount = getPlanAmount(planId, billingCycle);
  const order = await getClient().orders.create({
    amount,
    currency: "INR",
    receipt,
    payment_capture: 1,
    notes: notes ?? {},
  });
  return { id: order.id, amount: order.amount, currency: order.currency };
}

/**
 * Verify the signature Razorpay returns after a successful payment.
 * Computed as HMAC-SHA256 of `order_id|payment_id` with the key secret.
 */
export function verifySignature({ orderId, paymentId, signature }) {
  if (!KEY_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  // Constant-time compare to avoid timing-based signature oracle.
  return (
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  );
}