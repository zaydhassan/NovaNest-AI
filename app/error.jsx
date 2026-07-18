"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";

/**
 * Global error boundary (App Router). Renders when an unhandled error bubbles
 * to the root. Logs to the console in non-production; in production wire this to
 * Sentry/your tracker.
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[NovaNest] route error:", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo href={null} markSize={48} />
      <h1 className="aurora-text mt-8 text-4xl font-extrabold md:text-5xl">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred while rendering this page. You can try
        again, or head back to safety.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => reset()} className="shadow-glow">
          Try again
        </Button>
        <Link href="/">
          <Button variant="outline">Back to home</Button>
        </Link>
      </div>
    </div>
  );
}