import { getGitHubToken } from "./auth"

const GITHUB_API = "https://api.github.com"

async function githubFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = await getGitHubToken()

  if (!token) {
    throw new Error("Not authenticated")
  }

  const response = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }

  return response.json()
}

// Types
export interface GitHubRepo {
  id: number
  full_name: string
  name: string
  owner: { login: string }
  default_branch: string
  private: boolean
  html_url: string
}

export interface GitHubOrg {
  login: string
  id: number
}

export interface WorkflowRun {
  id: number
  name: string
  head_branch: string
  head_sha: string
  status: "queued" | "in_progress" | "completed"
  conclusion:
    | "success"
    | "failure"
    | "cancelled"
    | "skipped"
    | "timed_out"
    | "action_required"
    | null
  html_url: string
  created_at: string
  updated_at: string
  run_started_at: string
  run_attempt: number
  actor: {
    login: string
    avatar_url: string
  }
  triggering_actor: {
    login: string
    avatar_url: string
  }
  event: string
  display_title: string
  path: string
}

export interface WorkflowRunsResponse {
  total_count: number
  workflow_runs: WorkflowRun[]
}

// API functions
export async function getUserRepos(): Promise<GitHubRepo[]> {
  return githubFetch<GitHubRepo[]>(
    "/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member"
  )
}

// Get only repos owned by the user (personal repos)
export async function getPersonalRepos(): Promise<GitHubRepo[]> {
  return githubFetch<GitHubRepo[]>(
    "/user/repos?per_page=100&sort=pushed&affiliation=owner"
  )
}

export async function getUserOrgs(): Promise<GitHubOrg[]> {
  return githubFetch<GitHubOrg[]>("/user/orgs")
}

export async function getOrgRepos(org: string): Promise<GitHubRepo[]> {
  return githubFetch<GitHubRepo[]>(`/orgs/${org}/repos?per_page=100&sort=pushed`)
}

export async function searchRepos(query: string): Promise<GitHubRepo[]> {
  const userRepos = await getUserRepos()
  const orgs = await getUserOrgs()

  const orgReposPromises = orgs.map((org) => getOrgRepos(org.login))
  const orgReposArrays = await Promise.all(orgReposPromises)
  const orgRepos = orgReposArrays.flat()

  const allRepos = [...userRepos, ...orgRepos]

  // Deduplicate by full_name
  const uniqueRepos = Array.from(
    new Map(allRepos.map((repo) => [repo.full_name, repo])).values()
  )

  // Filter by query
  const lowerQuery = query.toLowerCase()
  return uniqueRepos.filter((repo) =>
    repo.full_name.toLowerCase().includes(lowerQuery)
  )
}

export async function getWorkflowRuns(
  owner: string,
  repo: string,
  perPage = 5
): Promise<WorkflowRun[]> {
  const response = await githubFetch<WorkflowRunsResponse>(
    `/repos/${owner}/${repo}/actions/runs?per_page=${perPage}`
  )
  return response.workflow_runs
}

export async function getLatestWorkflowRun(
  owner: string,
  repo: string
): Promise<WorkflowRun | null> {
  const runs = await getWorkflowRuns(owner, repo, 1)
  return runs[0] ?? null
}

// Get runs for multiple repos in parallel
export async function getMultipleRepoRuns(
  repos: Array<{ fullName: string }>
): Promise<Map<string, WorkflowRun | null>> {
  const results = await Promise.allSettled(
    repos.map(async (repo) => {
      const [owner, repoName] = repo.fullName.split("/")
      const run = await getLatestWorkflowRun(owner, repoName)
      return { fullName: repo.fullName, run }
    })
  )

  const map = new Map<string, WorkflowRun | null>()

  for (const result of results) {
    if (result.status === "fulfilled") {
      map.set(result.value.fullName, result.value.run)
    } else {
      // On error, set null
      const index = results.indexOf(result)
      if (index !== -1 && repos[index]) {
        map.set(repos[index].fullName, null)
      }
    }
  }

  return map
}
