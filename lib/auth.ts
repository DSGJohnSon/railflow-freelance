import { cache } from "react"
import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const SESSION_COOKIE = "railflow_admin"
const SESSION_MAX_AGE = 60 * 60 * 8 // 8 heures

/**
 * Both variables are required. When either is missing every check below fails
 * closed, so a misconfigured deployment locks the admin out rather than
 * letting anyone in.
 */
function getConfig() {
  const password = process.env.ADMIN_PASSWORD
  const secret = process.env.ADMIN_SESSION_SECRET

  if (!password || !secret) {
    return null
  }

  return { password, secret }
}

export function isConfigured() {
  return getConfig() !== null
}

/** Constant-time comparison. Hashing first keeps it independent of length. */
function equals(a: string, b: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest()
  return timingSafeEqual(digest(a), digest(b))
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex")
}

/** `<expiry>.<hmac>` — self-contained, so no session store is needed. */
function createToken(secret: string) {
  const expiresAt = String(Date.now() + SESSION_MAX_AGE * 1000)
  return `${expiresAt}.${sign(expiresAt, secret)}`
}

function verifyToken(token: string | undefined) {
  const config = getConfig()

  if (!config || !token) {
    return false
  }

  const [expiresAt, signature] = token.split(".")

  if (!expiresAt || !signature) {
    return false
  }

  // Signature first: an expired-but-valid token and a forged one must not be
  // distinguishable by anything other than the signature check.
  if (!equals(signature, sign(expiresAt, config.secret))) {
    return false
  }

  return Number(expiresAt) > Date.now()
}

export function verifyPassword(input: string) {
  const config = getConfig()
  return config !== null && equals(input, config.password)
}

/** Memoized for the render pass, so nested calls read the cookie once. */
export const isAdmin = cache(async () => {
  const store = await cookies()
  return verifyToken(store.get(SESSION_COOKIE)?.value)
})

/** Guard for anything behind the admin password. */
export async function requireAdmin() {
  if (!(await isAdmin())) {
    redirect("/login")
  }
}

export async function startAdminSession() {
  const config = getConfig()

  if (!config) {
    return
  }

  const store = await cookies()
  store.set(SESSION_COOKIE, createToken(config.secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
}

export async function endAdminSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}
