import { GitHub } from "arctic"
import { db, settings, sessions } from "@/db"
import { eq } from "drizzle-orm"

// GitHub OAuth configuration
const clientId = process.env.GITHUB_CLIENT_ID || ""
const clientSecret = process.env.GITHUB_CLIENT_SECRET || ""
const appUrl = process.env.APP_URL || "http://localhost:3000"

export const github = new GitHub(clientId, clientSecret, `${appUrl}/api/auth/callback`)

// Allowed GitHub usernames (whitelist)
const ALLOWED_USERNAMES = (process.env.ALLOWED_GITHUB_USERNAMES || "thb").split(",")

// Session management
export async function createSession(): Promise<string> {
  const sessionId = crypto.randomUUID()
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 // 30 days

  await db.insert(sessions).values({ id: sessionId, expiresAt })
  return sessionId
}

export async function validateSession(sessionId: string): Promise<boolean> {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  })

  if (!session) return false

  const now = Math.floor(Date.now() / 1000)
  if (session.expiresAt < now) {
    await db.delete(sessions).where(eq(sessions.id, sessionId))
    return false
  }

  return true
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId))
}

// Settings helpers
export async function getSetting(key: string): Promise<string | null> {
  const setting = await db.query.settings.findFirst({
    where: eq(settings.key, key),
  })
  return setting?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
}

export async function deleteSetting(key: string): Promise<void> {
  await db.delete(settings).where(eq(settings.key, key))
}

// Check if user is allowed
export function isAllowedUser(username: string): boolean {
  return ALLOWED_USERNAMES.includes(username.toLowerCase())
}

// Get GitHub token
export async function getGitHubToken(): Promise<string | null> {
  return getSetting("github_access_token")
}

// Get current user info
export async function getCurrentUser(): Promise<{ username: string } | null> {
  const username = await getSetting("github_username")
  if (!username) return null
  return { username }
}
