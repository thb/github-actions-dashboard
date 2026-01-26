import { createServerFn } from "@tanstack/react-start"
import { db, projects, repos, type Project, type Repo } from "@/db"
import { eq, asc } from "drizzle-orm"
import { searchRepos, getLatestWorkflowRun, type WorkflowRun } from "./github"

// List all projects with their repos
export const getProjects = createServerFn({ method: "GET" }).handler(
  async () => {
    const allProjects = await db.query.projects.findMany({
      orderBy: [asc(projects.order), asc(projects.id)],
    })

    const allRepos = await db.query.repos.findMany({
      orderBy: [asc(repos.order), asc(repos.id)],
    })

    return allProjects.map((project) => ({
      ...project,
      repos: allRepos.filter((repo) => repo.projectId === project.id),
    }))
  }
)

// Get a single project
export const getProject = createServerFn({ method: "GET" })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, id),
    })

    if (!project) return null

    const projectRepos = await db.query.repos.findMany({
      where: eq(repos.projectId, id),
      orderBy: [asc(repos.order), asc(repos.id)],
    })

    return { ...project, repos: projectRepos }
  })

// Create a new project
export const createProject = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; color?: string }) => data)
  .handler(async ({ data }) => {
    const result = await db
      .insert(projects)
      .values({ name: data.name, color: data.color })
      .returning()

    return result[0]
  })

// Update a project
export const updateProject = createServerFn({ method: "POST" })
  .inputValidator((data: { id: number; name?: string; color?: string }) => data)
  .handler(async ({ data }) => {
    const { id, ...updates } = data
    const result = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning()

    return result[0]
  })

// Delete a project
export const deleteProject = createServerFn({ method: "POST" })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await db.delete(projects).where(eq(projects.id, id))
    return { success: true }
  })

// Add a repo to a project
export const addRepoToProject = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { projectId: number; fullName: string; defaultBranch?: string }) =>
      data
  )
  .handler(async ({ data }) => {
    const result = await db
      .insert(repos)
      .values({
        projectId: data.projectId,
        fullName: data.fullName,
        defaultBranch: data.defaultBranch || "main",
      })
      .returning()

    return result[0]
  })

// Remove a repo from a project
export const removeRepoFromProject = createServerFn({ method: "POST" })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await db.delete(repos).where(eq(repos.id, id))
    return { success: true }
  })

// Search GitHub repos
export const searchGitHubRepos = createServerFn({ method: "GET" })
  .inputValidator((query: string) => query)
  .handler(async ({ data: query }) => {
    if (query.length < 2) return []
    return searchRepos(query)
  })

// Get workflow runs for all repos in a project
export const getProjectWorkflowRuns = createServerFn({ method: "GET" })
  .inputValidator((projectId: number) => projectId)
  .handler(async ({ data: projectId }) => {
    const projectRepos = await db.query.repos.findMany({
      where: eq(repos.projectId, projectId),
    })

    const runs: Array<{ repoId: number; fullName: string; run: WorkflowRun | null }> = []

    for (const repo of projectRepos) {
      const [owner, repoName] = repo.fullName.split("/")
      try {
        const run = await getLatestWorkflowRun(owner, repoName)
        runs.push({ repoId: repo.id, fullName: repo.fullName, run })
      } catch {
        runs.push({ repoId: repo.id, fullName: repo.fullName, run: null })
      }
    }

    return runs
  })

// Get all workflow runs for dashboard
export const getAllWorkflowRuns = createServerFn({ method: "GET" }).handler(
  async () => {
    const allRepos = await db.query.repos.findMany()

    const runs: Array<{
      repoId: number
      projectId: number
      fullName: string
      run: WorkflowRun | null
    }> = []

    // Process in batches of 10 to avoid rate limiting
    const batchSize = 10
    for (let i = 0; i < allRepos.length; i += batchSize) {
      const batch = allRepos.slice(i, i + batchSize)
      const batchResults = await Promise.allSettled(
        batch.map(async (repo) => {
          const [owner, repoName] = repo.fullName.split("/")
          const run = await getLatestWorkflowRun(owner, repoName)
          return {
            repoId: repo.id,
            projectId: repo.projectId,
            fullName: repo.fullName,
            run,
          }
        })
      )

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j]
        if (result.status === "fulfilled") {
          runs.push(result.value)
        } else {
          runs.push({
            repoId: batch[j].id,
            projectId: batch[j].projectId,
            fullName: batch[j].fullName,
            run: null,
          })
        }
      }
    }

    return runs
  }
)
