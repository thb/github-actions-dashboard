import { createFileRoute, redirect } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"
import {
  github,
  getSetting,
  setSetting,
  deleteSetting,
  createSession,
  isAllowedUser,
} from "@/lib/auth"

export const Route = createFileRoute("/api/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const code = url.searchParams.get("code")
        const state = url.searchParams.get("state")

        if (!code || !state) {
          return json({ error: "Missing code or state" }, { status: 400 })
        }

        // Verify state for CSRF protection
        const storedState = await getSetting("oauth_state")
        if (state !== storedState) {
          return json({ error: "Invalid state" }, { status: 400 })
        }

        // Clean up state
        await deleteSetting("oauth_state")

        try {
          // Exchange code for tokens
          const tokens = await github.validateAuthorizationCode(code)
          const accessToken = tokens.accessToken()

          // Get user info from GitHub
          const userResponse = await fetch("https://api.github.com/user", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/vnd.github+json",
            },
          })

          if (!userResponse.ok) {
            return json({ error: "Failed to fetch user info" }, { status: 500 })
          }

          const user = (await userResponse.json()) as { login: string }

          // Check if user is allowed
          if (!isAllowedUser(user.login)) {
            return json(
              { error: `User ${user.login} is not authorized` },
              { status: 403 }
            )
          }

          // Store tokens and user info
          await setSetting("github_access_token", accessToken)
          await setSetting("github_username", user.login)

          // Create session
          const sessionId = await createSession()
          await setSetting("session_id", sessionId)

          // Redirect to dashboard with session cookie
          const response = new Response(null, {
            status: 302,
            headers: {
              Location: "/",
              "Set-Cookie": `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`,
            },
          })

          return response
        } catch (error) {
          console.error("OAuth error:", error)
          return json({ error: "OAuth failed" }, { status: 500 })
        }
      },
    },
  },
})
