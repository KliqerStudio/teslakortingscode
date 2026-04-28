import type { MetadataRoute } from "next";

import { blogPosts } from "@/data/blogs";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: Array<{ path: string; priority: number; freq: MetadataRoute.Sitemap[0]["changeFrequency"] }> = [
    { path: "/", priority: 1.0, freq: "weekly" },
    { path: "/en", priority: 0.9, freq: "weekly" },
    { path: "/blog", priority: 0.85, freq: "weekly" },
    { path: "/tesla-referral-code-nederland", priority: 0.9, freq: "monthly" },
    { path: "/veelgestelde-vragen", priority: 0.8, freq: "monthly" },
    { path: "/disclaimer", priority: 0.3, freq: "yearly" },
    { path: "/privacy", priority: 0.3, freq: "yearly" },
    { path: "/en/faq", priority: 0.7, freq: "monthly" },
    { path: "/en/disclaimer", priority: 0.3, freq: "yearly" },
    { path: "/en/privacy", priority: 0.3, freq: "yearly" }
  ];

  const blogRoutes = blogPosts.map((post) => ({
    path: `/blog/${post.slug}`,
    priority: 0.85,
    freq: "monthly" as const
  }));

  return [...staticRoutes, ...blogRoutes].map(({ path, priority, freq }) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: freq,
    priority
  }));
}
