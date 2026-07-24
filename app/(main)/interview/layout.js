import { Suspense } from "react";

/**
 * Interview section layout. The Suspense fallback is a lightweight Tailwind
 * shimmer bar (replaces a `react-spinners` BarLoader so we don't ship that
 * dependency + its CSS-in-JS runtime into the interview route bundle).
 */
function LoadingBar() {
  return (
    <div className="mt-4 h-1 w-full animate-pulse rounded-full bg-muted/60" />
  );
}

export default function Layout({ children }) {
  return (
    <div className="px-5">
      <Suspense fallback={<LoadingBar />}>{children}</Suspense>
    </div>
  );
}