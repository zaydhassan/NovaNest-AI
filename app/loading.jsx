import { Skeleton } from "@/components/ui/skeleton";

/**
 * Root loading state — shown for the marketing surface and any top-level
 * navigation. Kept lightweight so first paint stays fast.
 */
export default function Loading() {
  return (
    <div className="container mx-auto px-4 pt-32 pb-20">
      <div className="mx-auto max-w-3xl space-y-5 text-center">
        <Skeleton className="mx-auto h-8 w-40" />
        <Skeleton className="mx-auto h-16 w-full max-w-2xl" />
        <Skeleton className="mx-auto h-16 w-full max-w-xl" />
        <div className="flex justify-center gap-3 pt-2">
          <Skeleton className="h-11 w-40 rounded-full" />
          <Skeleton className="h-11 w-40 rounded-full" />
        </div>
      </div>
      <Skeleton className="mx-auto mt-16 h-72 w-full max-w-5xl rounded-2xl" />
    </div>
  );
}