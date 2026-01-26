import { useState, useEffect } from "react"
import { createFileRoute, redirect, Link } from "@tanstack/react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getAuthStatus } from "@/lib/auth.server"
import { getProjects, getAllWorkflowRuns, removeRepoFromProject } from "@/lib/projects.server"
import { ProjectCard } from "@/components/project-card"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, LogOut, Github } from "lucide-react"
import type { WorkflowRun } from "@/lib/github"

export const Route = createFileRoute("/")({
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
  component: Dashboard,
})

function Dashboard() {
  const { projects: initialProjects } = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const queryClient = useQueryClient()

  // Projects query
  const { data: projects, refetch: refetchProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(),
    initialData: initialProjects,
  })

  // Workflow runs query with auto-refresh
  const { data: workflowRuns, refetch: refetchRuns, isFetching: isRefreshing } = useQuery({
    queryKey: ["workflowRuns"],
    queryFn: async () => {
      const runs = await getAllWorkflowRuns()
      const map = new Map<string, WorkflowRun | null>()
      for (const run of runs) {
        map.set(run.fullName, run.run)
      }
      return map
    },
    initialData: new Map(),
    refetchInterval: 30000, // 30 seconds
  })

  const handleRefresh = () => {
    refetchRuns()
    refetchProjects()
  }

  const handleRemoveRepo = async (repoId: number) => {
    await removeRepoFromProject({ data: repoId })
    refetchProjects()
  }

  const handleLogout = async () => {
    const form = document.createElement("form")
    form.method = "POST"
    form.action = "/api/auth/logout"
    document.body.appendChild(form)
    form.submit()
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Github className="h-8 w-8" />
            <h1 className="text-xl font-semibold">Actions Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Link to="/projects/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{user?.username}</span>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-4">
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <Github className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No projects yet</h2>
            <p className="text-muted-foreground mb-6">
              Create a project to start tracking your GitHub Actions
            </p>
            <Link to="/projects/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create your first project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                workflowRuns={workflowRuns}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                onRemoveRepo={handleRemoveRepo}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
