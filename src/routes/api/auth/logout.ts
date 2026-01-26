import { createFileRoute } from "@tanstack/react-router"
import { deleteSetting, deleteSession, getSetting } from "@/lib/auth"

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async () => {
        // Get and delete session
        const sessionId = await getSetting("session_id")
        if (sessionId) {
          await deleteSession(sessionId)
          await deleteSetting("session_id")
        }

        // Clear stored tokens
        await deleteSetting("github_access_token")
        await deleteSetting("github_username")

        // Redirect to login with cleared cookie
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/login",
            "Set-Cookie":
              "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
          },
        })
      },
    },
  },
})
