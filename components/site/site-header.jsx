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
import { checkUser } from "@/lib/checkUser";

/**
 * SiteHeader — sticky glass top bar. Server component (syncs the Clerk user
 * into our DB via checkUser, matching the original behavior). Interactive
 * bits (mobile sheet, theme toggle) are client islands.
 */
export async function SiteHeader() {
  await checkUser();

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Logo />

        {/* Desktop signed-in nav */}
        <div className="flex items-center gap-2 md:gap-3">
          <SignedIn>
            <Link href="/dashboard" className="hidden md:inline-flex">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                <LayoutDashboard className="h-4 w-4" />
                Insights
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="hidden md:inline-flex items-center gap-2">
                  <StarsIcon className="h-4 w-4" />
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

          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline">Sign in</Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                  userButtonPopoverCard: "shadow-xl",
                  userPreviewMainIdentifier: "font-semibold",
                },
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>

          {/* Mobile menu (signed in sees nav links; signed out can still toggle theme) */}
          <MobileMenu />
        </div>
      </nav>
    </header>
  );
}

export default SiteHeader;