import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const pages = ["", "/contact", "/privacy", "/terms", "/refund"];
  return pages.map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: path ? "monthly" : "weekly",
    priority: path ? 0.4 : 1,
  }));
}
