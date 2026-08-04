import { Suspense } from "react";

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