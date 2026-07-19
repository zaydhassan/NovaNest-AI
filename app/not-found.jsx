import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-blob" style={{ width: 420, height: 420, top: "10%", left: "15%", background: "hsl(var(--purple))", opacity: 0.18 }} />
        <div className="aurora-blob" style={{ width: 360, height: 360, bottom: "12%", right: "14%", background: "hsl(var(--cyan))", opacity: 0.16 }} />
      </div>
      <div className="relative z-10 flex flex-col items-center">
        <Logo href={null} markSize={48} />
        <h1 className="aurora-text animate-aurora mt-8 text-7xl font-extrabold md:text-8xl">
          404
        </h1>
        <h2 className="mt-2 text-2xl font-semibold">Page not found</h2>
        <p className="mb-8 mt-3 max-w-md text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/">
            <Button variant="gradient" className="shadow-glow">Return home</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Go to dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}