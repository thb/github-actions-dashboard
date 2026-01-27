import { useState } from "react"
import { createFileRoute, redirect, Link } from "@tanstack/react-router"
import { getAuthStatus } from "@/lib/auth.server"
import { getProjects } from "@/lib/projects.server"
import { Button } from "@/components/ui/button"
import { Github, ArrowLeft, Copy, Check, MessageSquare } from "lucide-react"

export const Route = createFileRoute("/slack")({
  beforeLoad: async () => {
    const auth = await getAuthStatus()
    if (!auth.authenticated) {
      throw redirect({ to: "/login" })
    }
    return { user: auth.user }
  },
  loader: async () => {
    const projects = await getProjects()
    return { projects }
  },
  component: SlackPage,
})

function SlackPage() {
  const { projects } = Route.useLoaderData()
  const [copiedAll, setCopiedAll] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Get all unique repos across all projects
  const allRepos = projects.flatMap((p) => p.repos.map((r) => r.fullName))
  const uniqueRepos = [...new Set(allRepos)]

  const getCommand = (repo: string) => `/github subscribe ${repo} workflows`

  const getAllCommands = () => uniqueRepos.map(getCommand).join("\n")

  const copyToClipboard = async (text: string, index?: number) => {
    await navigator.clipboard.writeText(text)
    if (index !== undefined) {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } else {
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Github className="h-8 w-8" />
            <h1 className="text-xl font-semibold">Slack Notifications</h1>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-6 w-6 text-primary mt-0.5" />
              <div>
                <h2 className="font-semibold mb-2">Setup GitHub notifications in Slack</h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-sm">
                  <li>Install the <a href="https://slack.github.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub app for Slack</a></li>
                  <li>Go to your Slack channel (e.g. #ci-alerts)</li>
                  <li>Run the commands below to subscribe to workflow notifications</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Copy all button */}
          {uniqueRepos.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={() => copyToClipboard(getAllCommands())} variant="default">
                {copiedAll ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy all commands ({uniqueRepos.length})
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Commands list */}
          <div className="bg-card border rounded-lg divide-y">
            {uniqueRepos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No repos configured yet. Add repos to your projects first.
              </div>
            ) : (
              uniqueRepos.map((repo, index) => (
                <div
                  key={repo}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 group"
                >
                  <code className="text-sm font-mono">{getCommand(repo)}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(getCommand(repo), index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Unsubscribe section */}
          {uniqueRepos.length > 0 && (
            <div className="bg-muted/50 border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> To unsubscribe, use: <code className="bg-muted px-1 rounded">/github unsubscribe owner/repo workflows</code>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
