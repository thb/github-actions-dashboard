import { formatDistanceToNow } from "@/lib/date"
import { WorkflowBadge } from "./workflow-badge"
import type { WorkflowRun } from "@/lib/github"
import {
  GitBranch,
  ExternalLink,
  User,
  Clock,
  Trash2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface RepoStatusProps {
  fullName: string
  run: WorkflowRun | null
  onRemove?: () => void
  isRemoving?: boolean
}

export function RepoStatus({
  fullName,
  run,
  onRemove,
  isRemoving,
}: RepoStatusProps) {
  const [owner, repo] = fullName.split("/")

  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-md border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Repo name */}
        <div className="flex-1 min-w-0">
          <a
            href={`https://github.com/${fullName}/actions`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline truncate flex items-center gap-1"
          >
            <span className="text-muted-foreground">{owner}/</span>
            <span>{repo}</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>

          {run ? (
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              {/* Workflow name */}
              <span className="truncate max-w-[200px]">{run.display_title}</span>

              {/* Branch */}
              <span className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                {run.head_branch}
              </span>

              {/* Time */}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(run.created_at))}
              </span>

              {/* Actor */}
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {run.actor.login}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              No workflow runs
            </div>
          )}
        </div>

        {/* Status badge */}
        {run && (
          <a
            href={run.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <WorkflowBadge status={run.status} conclusion={run.conclusion} />
          </a>
        )}
      </div>

      {/* Remove button */}
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="ml-2 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          disabled={isRemoving}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
