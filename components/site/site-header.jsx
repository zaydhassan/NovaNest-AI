import Link from "next/link";
import {
  PenBox,
  LayoutDashboard,
  FileText,
  GraduationCap,
  ChevronDown,
  StarsIcon,
  KanbanSquare,
  Wand2,
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";
import { MobileMenu } from "@/components/site/mobile-menu";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { CommandPalette } from "@/components/site/command-palette";
import { PlanBadge } from "@/components/site/plan-badge";
import { HeaderScrollShell } from "@/components/site/header-scroll-shell";
import { checkUser } from "@/lib/checkUser";

/**
 * SiteHeader — sticky glass top bar. Server component (syncs the Clerk user
 * into our DB via checkUser, matching the original behavior). The scroll
 * shrink/glass behavior lives in the client HeaderScrollShell wrapper;
 * interactive bits (mobile sheet, theme toggle) are client islands.
 */
export async function SiteHeader() {
  const user = await checkUser();

  return (
    <HeaderScrollShell>
      <nav className="container mx-auto flex h-full items-center justify-between px-4">
        <Logo />

        {/* Desktop signed-in nav */}
        <div className="flex items-center gap-2 md:gap-3">
          <SignedIn>
            {user?.plan && user.plan !== "STARTER" && (
              <PlanBadge plan={user.plan} className="hidden md:inline-flex" />
            )}
            <Link href="/dashboard" className="hidden md:inline-flex">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                <LayoutDashboard className="h-4 w-4" />
                Insights
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="hidden md:inline-flex items-center gap-2">
                  <StarsIcon className="h-4 w-4 text-primary" />
                  Growth Tools
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link href="/resume" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Resume Builder
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/ai-cover-letter" className="flex items-center gap-2">
                    <PenBox className="h-4 w-4" />
                    Cover Letters
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/interview" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Interview Prep
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/applications" className="flex items-center gap-2">
                    <KanbanSquare className="h-4 w-4" />
                    Application Tracker
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/ai-tools" className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4" />
                    AI Career Tools
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SignedIn>

          <ThemeToggle className="hidden md:inline-flex" />

          <CommandPalette className="hidden md:inline-flex" />

          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline">Sign in</Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 rounded-full ring-1 ring-white/10",
                },
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>

          {/* Mobile menu (signed in sees nav links; signed out can still toggle theme) */}
          <MobileMenu />
        </div>
      </nav>
    </HeaderScrollShell>
  );
}

export default SiteHeader;