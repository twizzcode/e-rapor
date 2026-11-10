import "server-only"

import { cache } from "react"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"

/**
 * Resolve the current session once per request. Layouts, pages, and server
 * actions in the same render pass share the result instead of hitting the
 * database again.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})
