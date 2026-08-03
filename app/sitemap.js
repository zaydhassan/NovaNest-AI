const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novanest.ai";

/**
 * sitemap.xml — discovery map for the public (indexable) surfaces only.
 * Authenticated app routes are excluded (see app/robots.js disallow list).
 */
export default function sitemap() {
  const now = new Date().toISOString();
  return [
    {
      url: `${APP_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${APP_URL}/sign-in`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${APP_URL}/sign-up`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
}