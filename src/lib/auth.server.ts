import { createServerFn } from "@tanstack/react-start"
import { getCookie } from "@tanstack/react-start/server"
import { getSetting, validateSession, getCurrentUser } from "./auth"

export const getAuthStatus = createServerFn({ method: "GET" }).handler(
  async () => {
    const sessionCookie = await getCookie("session")

    if (!sessionCookie) {
      return { authenticated: false, user: null }
    }

    const storedSessionId = await getSetting("session_id")

    if (sessionCookie !== storedSessionId) {
      return { authenticated: false, user: null }
    }

    const isValid = await validateSession(sessionCookie)

    if (!isValid) {
      return { authenticated: false, user: null }
    }

    const user = await getCurrentUser()

    return { authenticated: true, user }
  }
)
