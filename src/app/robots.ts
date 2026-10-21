import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/home", "/discover", "/create", "/messages", "/notifications", "/profile", "/settings", "/business", "/dating", "/search", "/u", "/post", "/businesses", "/news", "/auth/", "/reset-password", "/offline"],
    }],
    sitemap: `${base}/sitemap.xml`,
  };
}
