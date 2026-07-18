import { Skeleton } from "@/components/ui/skeleton";

/**
 * App-shell loading state — covers /dashboard, /resume, /interview,
 * /ai-cover-letter, and /onboarding. A page-title skeleton + grid of cards
 * matches the layout users land on, so the transition feels seamless.
 */
export default function Loading() {
  return (
    <div className="container mx-auto mt-24 mb-20 px-4">
      <Skeleton className="mb-8 h-12 w-72 rounded-xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}