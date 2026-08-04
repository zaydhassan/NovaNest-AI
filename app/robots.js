const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novanest.ai";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api", "/resume", "/interview", "/applications", "/ai-cover-letter", "/ai-tools", "/coach", "/twin", "/github", "/learning", "/memory", "/timeline", "/dream-company", "/intelligence", "/notifications", "/onboarding"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}