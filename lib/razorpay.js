import crypto from "crypto";
import Razorpay from "razorpay";
import { AppError } from "@/lib/errors";

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

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

export const PLANS = {
  PRO: {
    id: "PRO",
    name: "Pro",
    monthly: 1499 * 100,
    annual: Math.round(1499 * 12 * 0.8) * 100,
  },
  TEAMS: {
    id: "TEAMS",
    name: "Teams",
    monthly: 3999 * 100,
    annual: Math.round(3999 * 12 * 0.8) * 100,
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

export function verifySignature({ orderId, paymentId, signature }) {
  if (!KEY_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return (
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  );
}