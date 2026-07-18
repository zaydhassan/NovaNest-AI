import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Layout({ children }) {
  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="aurora-text animate-aurora text-4xl font-extrabold md:text-5xl">
            Industry Insights
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-analyzed trends, salaries, and skills for your field.
          </p>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-xl" />
          </div>
        }
      >
        {children}
      </Suspense>
    </div>
  );
}