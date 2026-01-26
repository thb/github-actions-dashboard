import { createFileRoute, redirect } from "@tanstack/react-router"
import { generateState } from "arctic"
import { github, setSetting } from "@/lib/auth"

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      GET: async () => {
        const state = generateState()

        // Store state for CSRF protection
        await setSetting("oauth_state", state)

        const url = github.createAuthorizationURL(state, ["repo", "read:org"])

        throw redirect({ href: url.toString() })
      },
    },
  },
})
