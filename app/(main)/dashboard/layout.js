import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/site/page-header";

export default function Layout({ children }) {
  return (
    <div className="container mx-auto">
      <PageHeader
        eyebrow="Dashboard"
        title="Industry Insights"
        description="AI-analyzed trends, salaries, and skills for your field."
      />
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