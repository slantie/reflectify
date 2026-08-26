import type { MetadataRoute } from "next"

const siteOrigin = (process.env.APP_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
)

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about-us", "/contact", "/docs"],
      disallow: [
        "/analytics",
        "/dashboard",
        "/feedback/",
        "/feedback-forms",
        "/upload",
        "/academic-years",
        "/allocations",
        "/colleges",
        "/departments",
        "/divisions",
        "/faculty",
        "/schedule",
        "/semesters",
        "/subjects",
      ],
    },
    sitemap: `${siteOrigin}/sitemap.xml`,
  }
}
