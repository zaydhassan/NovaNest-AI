import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark as clerkDark } from "@clerk/themes";
import { Toaster } from "sonner";
import { MotionProvider } from "@/components/site/motion-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { AuroraBackground } from "@/components/site/aurora-background";
import { NoiseOverlay } from "@/components/site/noise-overlay";
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
    default: "NovaNest AI — The AI Career Operating System",
    template: "%s · NovaNest AI",
  },
  description:
    "NovaNest is the AI Career Operating System — one workspace that remembers your career. Build resumes, prep interviews, track applications, and get guidance powered by specialist AI agents and long-term career memory.",
  keywords: [
    "AI Career OS",
    "career copilot",
    "career memory",
    "resume builder",
    "ATS resume",
    "interview prep",
    "cover letter generator",
    "industry insights",
    "application tracker",
    "NovaNest AI",
  ],
  authors: [{ name: "NovaNest AI" }],
  applicationName: "NovaNest AI",
  openGraph: {
    title: "NovaNest AI — The AI Career Operating System",
    description:
      "One workspace that remembers your career — resumes, interviews, applications, and guidance powered by specialist AI agents that coordinate instead of guess.",
    type: "website",
    url: APP_URL,
    siteName: "NovaNest AI",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "NovaNest AI — The AI Career Operating System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NovaNest AI",
    description: "The AI Career Operating System — a workspace that remembers your career and thinks alongside you.",
    images: ["/banner.png"],
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
            <MotionProvider>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
              >
                Skip to content
              </a>
              <AuroraBackground />
              <NoiseOverlay />
              <SiteHeader />
              <main id="main-content" className="min-h-screen">
                {children}
              </main>
              <SiteFooter />
              <Toaster richColors position="bottom-right" />
            </MotionProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}