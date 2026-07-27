import type { MetadataRoute } from "next"

/**
 * Client pages are protected by the secrecy of their URL, so the whole app
 * stays out of search engines.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  }
}
