import type { MetadataRoute } from "next"

const siteOrigin = (process.env.APP_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
)

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteOrigin, changeFrequency: "weekly", priority: 1 },
    {
      url: `${siteOrigin}/about-us`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteOrigin}/docs`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteOrigin}/contact`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ]
}
