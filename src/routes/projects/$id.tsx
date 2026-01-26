import { useState } from "react"
import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { getAuthStatus } from "@/lib/auth.server"
import {
  getProject,
  updateProject,
  deleteProject,
  addRepoToProject,
  removeRepoFromProject,
  getGitHubOrgs,
  getGitHubUserRepos,
  getGitHubOrgRepos,
} from "@/lib/projects.server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ArrowLeft, Plus, Trash2, Loader2, ChevronDown, Building2, User } from "lucide-react"
import type { GitHubRepo } from "@/lib/github"

export const Route = createFileRoute("/projects/$id")({
  beforeLoad: async () => {
    const auth = await getAuthStatus()
    if (!auth.authenticated) {
      throw redirect({ to: "/login" })
    }
  },
  loader: async ({ params }) => {
    const project = await getProject({ data: parseInt(params.id, 10) })
    if (!project) {
      throw redirect({ to: "/" })
    }
    return { project }
  },
  component: ProjectDetailPage,
})

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
]

function ProjectDetailPage() {
  const navigate = useNavigate()
  const { project: initialProject } = Route.useLoaderData()
  const { id } = Route.useParams()

  const { data: project, refetch } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject({ data: parseInt(id, 10) }),
    initialData: initialProject,
  })

  const [name, setName] = useState(project?.name || "")
  const [color, setColor] = useState(project?.color || COLORS[0])
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddRepoDialog, setShowAddRepoDialog] = useState(false)

  // Repo selection state
  const [selectedSource, setSelectedSource] = useState<string>("personal")
  const [filterQuery, setFilterQuery] = useState("")
  const [isAddingRepo, setIsAddingRepo] = useState<string | null>(null)

  // Fetch orgs
  const { data: orgs = [] } = useQuery({
    queryKey: ["github-orgs"],
    queryFn: () => getGitHubOrgs(),
    enabled: showAddRepoDialog,
  })

  // Fetch repos based on selected source
  const { data: sourceRepos = [], isLoading: isLoadingRepos } = useQuery({
    queryKey: ["github-repos", selectedSource],
    queryFn: () =>
      selectedSource === "personal"
        ? getGitHubUserRepos()
        : getGitHubOrgRepos({ data: selectedSource }),
    enabled: showAddRepoDialog,
  })

  // Filter repos by query and exclude already added ones
  const existingRepos = new Set(project?.repos.map((r) => r.fullName) || [])
  const filteredRepos = sourceRepos
    .filter((repo) => !existingRepos.has(repo.full_name))
    .filter((repo) =>
      filterQuery
        ? repo.full_name.toLowerCase().includes(filterQuery.toLowerCase())
        : true
    )

  if (!project) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateProject({ data: { id: project.id, name, color } })
      refetch()
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteProject({ data: project.id })
      navigate({ to: "/" })
    } catch (error) {
      console.error("Failed to delete project:", error)
      setIsDeleting(false)
    }
  }

  const handleAddRepo = async (repo: GitHubRepo) => {
    setIsAddingRepo(repo.full_name)
    try {
      await addRepoToProject({
        data: {
          projectId: project.id,
          fullName: repo.full_name,
          defaultBranch: repo.default_branch,
        },
      })
      refetch()
    } finally {
      setIsAddingRepo(null)
    }
  }

  const handleRemoveRepo = async (repoId: number) => {
    await removeRepoFromProject({ data: repoId })
    refetch()
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        {/* Project Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Project Settings</CardTitle>
            <CardDescription>
              Update your project name and color
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded-full transition-all ${
                      color === c
                        ? "ring-2 ring-offset-2 ring-offset-background ring-primary"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete Project
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Repositories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Repositories</CardTitle>
              <CardDescription>
                Manage repositories in this project
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddRepoDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Repository
            </Button>
          </CardHeader>
          <CardContent>
            {project.repos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No repositories yet</p>
                <Button
                  variant="link"
                  onClick={() => setShowAddRepoDialog(true)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add your first repository
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {project.repos.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <a
                        href={`https://github.com/${repo.fullName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline"
                      >
                        {repo.fullName}
                      </a>
                      <p className="text-sm text-muted-foreground">
                        Default branch: {repo.defaultBranch}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveRepo(repo.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent onClose={() => setShowDeleteDialog(false)}>
            <DialogHeader>
              <DialogTitle>Delete Project</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{project.name}"? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Repository Dialog */}
        <Dialog open={showAddRepoDialog} onOpenChange={setShowAddRepoDialog}>
          <DialogContent
            onClose={() => setShowAddRepoDialog(false)}
            className="max-w-lg"
          >
            <DialogHeader>
              <DialogTitle>Add Repository</DialogTitle>
              <DialogDescription>
                Select a source and choose repositories to add
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Source selector */}
              <div className="space-y-2">
                <Label>Source</Label>
                <div className="relative">
                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="personal">Personal repositories</option>
                    {orgs.map((org) => (
                      <option key={org.id} value={org.login}>
                        {org.login}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 pointer-events-none text-muted-foreground" />
                </div>
              </div>

              {/* Filter input */}
              <div className="space-y-2">
                <Label>Filter</Label>
                <Input
                  placeholder="Filter repositories..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                />
              </div>

              {/* Repos list */}
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {isLoadingRepos ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredRepos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    {sourceRepos.length === 0
                      ? "No repositories found"
                      : "All repositories are already added"}
                  </p>
                ) : (
                  filteredRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-3">
                        {selectedSource === "personal" ? (
                          <User className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium">{repo.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {repo.private ? "Private" : "Public"} · {repo.default_branch}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddRepo(repo)}
                        disabled={isAddingRepo === repo.full_name}
                      >
                        {isAddingRepo === repo.full_name ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
