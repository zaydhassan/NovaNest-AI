import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  PenBox,
  ChevronDown,
  KanbanSquare,
  Wand2,
  Sparkles,
  Github,
  Fingerprint,
  Rocket,
  Mic,
  ListChecks,
  LineChart,
  Radar,
  LayoutGrid,
  Brain,
  Flag,
  Target,
  Gauge,
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
import { CoachDrawer } from "@/components/site/coach-drawer";
import { PlanBadge } from "@/components/site/plan-badge";
import { HeaderScrollShell } from "@/components/site/header-scroll-shell";
import { NotificationBell } from "@/components/site/notification-bell";
import { checkUser } from "@/lib/checkUser";
import { db } from "@/lib/prisma";

export async function SiteHeader() {
  const user = await checkUser();

  const unreadCount = user
    ? await db.notification.count({
        where: { userId: user.id, isRead: false },
      })
    : 0;

  return (
    <HeaderScrollShell>
      <nav className="container mx-auto flex h-full items-center justify-between px-4">
        <Logo />

        <div className="flex items-center gap-2 md:gap-3">
          {user?.plan && user.plan !== "STARTER" && (
            <PlanBadge plan={user.plan} className="hidden md:inline-flex" />
          )}

          <SignedIn>
            <Link href="/dashboard" className="hidden md:inline-flex">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                <LayoutDashboard className="h-4 w-4" />
                Home
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden md:inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <LayoutGrid className="h-4 w-4" />
                  Workspace
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
                  <Link href="/ai-tools" className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4" />
                    AI Tools
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/applications" className="hidden md:inline-flex">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                <KanbanSquare className="h-4 w-4" />
                Pipeline
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden md:inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <LineChart className="h-4 w-4" />
                  Prep
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link href="/interview/mock" className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Mock Interview
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/interview/quiz" className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4" />
                    Quick Quiz
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/interview" className="flex items-center gap-2">
                    <LineChart className="h-4 w-4" />
                    Trends
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden md:inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Radar className="h-4 w-4" />
                  Intelligence
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/twin" className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4" />
                    Career Twin
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/github" className="flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    GitHub Analyzer
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/learning" className="flex items-center gap-2">
                    <Rocket className="h-4 w-4" />
                    Learning Engine
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/memory" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Memory Engine
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/timeline" className="flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    Career Timeline
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dream-company" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Dream Company
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/intelligence" className="flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    Career Intelligence
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SignedIn>

          <ThemeToggle className="hidden md:inline-flex" />

          <CommandPalette className="hidden md:inline-flex" />

          <SignedIn>
            <CoachDrawer className="hidden md:inline-flex" />
          </SignedIn>

          <SignedIn>
            <NotificationBell
              count={unreadCount}
              className="hidden md:inline-flex"
            />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal" forceRedirectUrl="/">
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

          <MobileMenu />
        </div>
      </nav>
    </HeaderScrollShell>
  );
}

export default SiteHeader;