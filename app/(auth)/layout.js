import { Logo } from "@/components/site/logo";

/**
 * Auth layout — centered card with brandmark above. Used by /sign-in & /sign-up.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-28 pb-16">
      <div className="mb-8 flex flex-col items-center gap-3">
        <Logo href={null} markSize={44} />
        <p className="text-sm text-muted-foreground">
          Sign in to continue to your career workspace
        </p>
      </div>
      {children}
    </div>
  );
}