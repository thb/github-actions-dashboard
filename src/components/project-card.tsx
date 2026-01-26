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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: project.color || "#6366f1" }}
          />
          <CardTitle className="text-base font-semibold">{project.name}</CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-2">
            {successCount > 0 && (
              <span className="text-green-600 dark:text-green-400">
                ✓{successCount}
              </span>
            )}
            {failureCount > 0 && (
              <span className="text-red-600 dark:text-red-400">
                ✗{failureCount}
              </span>
            )}
            {runningCount > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                ●{runningCount}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Link to="/projects/$id" params={{ id: String(project.id) }}>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 px-4 pb-3 pt-0">
        {project.repos.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
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
