import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark as clerkDark } from "@clerk/themes";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuroraBackground } from "@/components/site/aurora-background";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novanest.ai";

export const metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "NovaNest AI — Your AI Career Growth OS",
    template: "%s · NovaNest AI",
  },
  description:
    "NovaNest AI is the AI career growth platform — build ATS-optimized resumes, practice role-specific interviews, generate cover letters, and track industry insights, all in one workspace.",
  keywords: [
    "AI career coach",
    "resume builder",
    "ATS resume",
    "interview prep",
    "cover letter generator",
    "industry insights",
    "career growth",
    "NovaNest AI",
  ],
  authors: [{ name: "NovaNest AI" }],
  openGraph: {
    title: "NovaNest AI — Your AI Career Growth OS",
    description:
      "Build ATS-optimized resumes, practice interviews, generate cover letters, and track market insights — powered by AI.",
    type: "website",
    url: APP_URL,
    siteName: "NovaNest AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "NovaNest AI",
    description: "Your AI Career Growth OS — resumes, interviews, cover letters & insights.",
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070B1A" },
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: clerkDark,
        variables: {
          colorPrimary: "hsl(var(--primary))",
          colorText: "hsl(var(--foreground))",
          colorTextSecondary: "hsl(var(--muted-foreground))",
          colorBackground: "hsl(var(--popover))",
          colorInputBackground: "hsl(var(--input))",
          colorInputText: "hsl(var(--foreground))",
          borderRadius: "var(--radius)",
        },
        elements: {
          formButtonPrimary:
            "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
          card: "bg-card border border-border shadow-lg",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton:
            "border border-border bg-background text-foreground hover:bg-muted hover:text-foreground transition-colors",
          socialButtonsBlockButtonText: "text-foreground",
          socialButtonsIconButton:
            "border border-border bg-background text-foreground hover:bg-muted transition-colors",
          formFieldLabel: "text-foreground",
          footerText: "text-muted-foreground",
          footerTextLink: "text-primary hover:text-primary/80",
          formFieldInput:
            "bg-input text-foreground border-border placeholder:text-muted-foreground",
          // UserButton popover — keep menu actions (Manage account / Sign out) legible on dark.
          userButtonPopoverBox:
            "bg-popover border border-border shadow-glass-lg",
          userButtonPopoverActionButton:
            "bg-transparent text-foreground hover:bg-muted hover:text-foreground",
          userButtonPopoverActionButtonText: "text-foreground",
          userButtonPopoverActionButtonIcon: "text-muted-foreground",
          userButtonPopoverFooter: "bg-transparent",
          userButtonPopoverFooterText: "text-muted-foreground",
          userPreviewMainIdentifier: "text-foreground font-semibold",
          userPreviewSecondaryIdentifier: "text-muted-foreground",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {/* Skip link for keyboard / screen-reader users. */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
            >
              Skip to content
            </a>
            <AuroraBackground />
            <SiteHeader />
            <main id="main-content" className="min-h-screen">
              {children}
            </main>
            <SiteFooter />
            <Toaster richColors position="bottom-right" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}