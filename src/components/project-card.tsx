import { useState } from "react"
import { Link } from "@tanstack/react-router"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RepoStatus } from "./repo-status"
import { Settings, Plus, RefreshCw } from "lucide-react"
import type { WorkflowRun } from "@/lib/github"

interface ProjectCardProps {
  project: {
    id: number
    name: string
    color: string | null
    repos: Array<{
      id: number
      fullName: string
    }>
  }
  workflowRuns: Map<string, WorkflowRun | null>
  onRefresh?: () => void
  isRefreshing?: boolean
  onRemoveRepo?: (repoId: number) => void
}

export function ProjectCard({
  project,
  workflowRuns,
  onRefresh,
  isRefreshing,
  onRemoveRepo,
}: ProjectCardProps) {
  const [removingRepoId, setRemovingRepoId] = useState<number | null>(null)

  const handleRemoveRepo = async (repoId: number) => {
    setRemovingRepoId(repoId)
    onRemoveRepo?.(repoId)
  }

  // Count statuses
  const statuses = project.repos.map((repo) => {
    const run = workflowRuns.get(repo.fullName)
    if (!run) return "unknown"
    if (run.status !== "completed") return "running"
    return run.conclusion
  })

  const successCount = statuses.filter((s) => s === "success").length
  const failureCount = statuses.filter((s) => s === "failure").length
  const runningCount = statuses.filter((s) => s === "running").length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: project.color || "#6366f1" }}
          />
          <CardTitle className="text-xl">{project.name}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {successCount > 0 && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                {successCount} passing
              </span>
            )}
            {failureCount > 0 && (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                {failureCount} failing
              </span>
            )}
            {runningCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                {runningCount} running
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Link to="/projects/$id" params={{ id: String(project.id) }}>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {project.repos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No repositories added yet</p>
            <Link to="/projects/$id" params={{ id: String(project.id) }}>
              <Button variant="link" className="mt-2">
                <Plus className="h-4 w-4 mr-1" />
                Add repositories
              </Button>
            </Link>
          </div>
        ) : (
          project.repos.map((repo) => (
            <RepoStatus
              key={repo.id}
              fullName={repo.fullName}
              run={workflowRuns.get(repo.fullName) ?? null}
              onRemove={() => handleRemoveRepo(repo.id)}
              isRemoving={removingRepoId === repo.id}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
