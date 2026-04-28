import type { MetadataRoute } from "next";

import { blogPosts } from "@/data/blogs";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = [
    "/",
    "/en",
    "/blog",
    "/tesla-referral-code-nederland",
    "/veelgestelde-vragen",
    "/disclaimer",
    "/privacy",
    "/en/faq",
    "/en/disclaimer",
    "/en/privacy"
  ];

  const blogRoutes = blogPosts.map((post) => `/blog/${post.slug}`);

  return [...staticRoutes, ...blogRoutes].map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path.startsWith("/blog") || path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/blog") ? 0.85 : 0.75
  }));
}
