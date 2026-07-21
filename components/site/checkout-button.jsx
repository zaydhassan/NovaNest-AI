"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import {
  createPaymentOrderAction,
  verifyPaymentAction,
} from "@/actions/payments";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// Load the Razorpay checkout script once and memoize the promise so multiple
// buttons don't race to inject the same <script>.
let scriptPromise = null;
function loadCheckoutScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("client only"));
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = CHECKOUT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null; // allow a retry on a later click
      reject(new Error("Couldn't load the checkout. Please try again."));
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/**
 * CheckoutButton — opens the Razorpay Standard Checkout modal for a
 * purchasable plan. Handles signed-out users by sending them to Clerk
 * sign-in. The server creates the order; on a successful modal payment the
 * client posts the signature back for server-side verification.
 */
export function CheckoutButton({
  plan,
  billingCycle,
  variant = "outline",
  className,
  children,
}) {
  const router = useRouter();
  const { isSignedIn, isLoaded, user } = useUser();
  const [opening, setOpening] = useState(false);

  const {
    fn: createOrder,
    loading: creating,
  } = useFetch(createPaymentOrderAction);

  const { fn: verifyPayment, loading: verifying } = useFetch(verifyPaymentAction);

  // Preload the checkout script on mount so the modal opens fast on click.
  useEffect(() => {
    loadCheckoutScript().catch(() => {});
  }, []);

  const busy = creating || verifying || opening;

  async function handleCheckout() {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    try {
      await loadCheckoutScript();
    } catch (err) {
      toast.error(err?.message || "Couldn't load the checkout. Please try again.");
      return;
    }

    const order = await createOrder({ planId: plan.id, billingCycle });
    if (!order || !order.orderId || !order.keyId) return;

    setOpening(true);
    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "NovaNest AI",
      description: `${order.planName} plan — ${billingCycle}`,
      order_id: order.orderId,
      prefill: {
        name: order.name || user?.firstName || "",
        email: order.email || user?.primaryEmailAddress?.emailAddress || "",
      },
      theme: { color: "#7c3aed" },
      handler: async (response) => {
        const result = await verifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          planId: plan.id,
          billingCycle,
        });
        if (result?.success) {
          toast.success(`You're on the ${order.planName} plan! 🎉`);
          router.refresh();
        }
      },
      modal: {
        ondismiss: () => {
          setOpening(false);
          toast("Checkout closed — you weren't charged.");
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        setOpening(false);
        toast.error(resp?.error?.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err) {
      toast.error("Couldn't open the checkout. Please try again.");
    } finally {
      setOpening(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={handleCheckout}
      disabled={busy || !isLoaded}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

export default CheckoutButton;