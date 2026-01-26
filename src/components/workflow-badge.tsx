import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  XCircle,
  Clock,
  XOctagon,
  Loader2,
  AlertCircle,
} from "lucide-react"

type WorkflowStatus = "queued" | "in_progress" | "completed"
type WorkflowConclusion =
  | "success"
  | "failure"
  | "cancelled"
  | "skipped"
  | "timed_out"
  | "action_required"
  | null

interface WorkflowBadgeProps {
  status: WorkflowStatus
  conclusion: WorkflowConclusion
  className?: string
}

export function WorkflowBadge({
  status,
  conclusion,
  className,
}: WorkflowBadgeProps) {
  if (status === "queued") {
    return (
      <Badge
        variant="secondary"
        className={cn("gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", className)}
      >
        <Clock className="h-3 w-3" />
        Queued
      </Badge>
    )
  }

  if (status === "in_progress") {
    return (
      <Badge
        variant="secondary"
        className={cn("gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", className)}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Running
      </Badge>
    )
  }

  // Completed states
  switch (conclusion) {
    case "success":
      return (
        <Badge
          variant="success"
          className={cn("gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", className)}
        >
          <CheckCircle className="h-3 w-3" />
          Success
        </Badge>
      )
    case "failure":
      return (
        <Badge
          variant="destructive"
          className={cn("gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", className)}
        >
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      )
    case "cancelled":
      return (
        <Badge
          variant="secondary"
          className={cn("gap-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", className)}
        >
          <XOctagon className="h-3 w-3" />
          Cancelled
        </Badge>
      )
    case "skipped":
      return (
        <Badge
          variant="secondary"
          className={cn("gap-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", className)}
        >
          <AlertCircle className="h-3 w-3" />
          Skipped
        </Badge>
      )
    case "timed_out":
      return (
        <Badge
          variant="destructive"
          className={cn("gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", className)}
        >
          <Clock className="h-3 w-3" />
          Timed out
        </Badge>
      )
    case "action_required":
      return (
        <Badge
          variant="warning"
          className={cn("gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", className)}
        >
          <AlertCircle className="h-3 w-3" />
          Action required
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className={cn("gap-1", className)}>
          <AlertCircle className="h-3 w-3" />
          Unknown
        </Badge>
      )
  }
}
