import { cache } from "react"
import { randomBytes } from "node:crypto"
import { readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"

import type { Client, Project } from "@/data/types"
import { parseIsoDate, toIsoDate } from "@/lib/format"
import {
  clientsFileSchema,
  projectsFileSchema,
  type StoredProject,
} from "@/lib/schemas"

const dataDir = path.join(process.cwd(), "data")
const clientsFile = path.join(dataDir, "clients.json")
const projectsFile = path.join(dataDir, "projects.json")

async function readJsonFile(file: string) {
  const contents = await readFile(file, "utf8")

  try {
    return JSON.parse(contents) as unknown
  } catch (error) {
    throw new Error(
      `${path.basename(file)} n'est pas un JSON valide : ${(error as Error).message}`
    )
  }
}

/**
 * Written to a sibling temp file then renamed, so an interrupted write can
 * never leave a half-serialized data file behind.
 */
async function writeJsonFile(file: string, value: unknown) {
  const temp = `${file}.${randomBytes(4).toString("hex")}.tmp`

  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, "utf8")
  await rename(temp, file)
}

function fail(file: string, issues: string) {
  return new Error(`${path.basename(file)} est invalide :\n${issues}`)
}

async function loadClientsUncached(): Promise<Client[]> {
  const parsed = clientsFileSchema.safeParse(await readJsonFile(clientsFile))

  if (!parsed.success) {
    throw fail(clientsFile, JSON.stringify(parsed.error.issues, null, 2))
  }

  return parsed.data
}

async function loadProjectsUncached(): Promise<Project[]> {
  const parsed = projectsFileSchema.safeParse(await readJsonFile(projectsFile))

  if (!parsed.success) {
    throw fail(projectsFile, JSON.stringify(parsed.error.issues, null, 2))
  }

  return parsed.data.map((project) => ({
    ...project,
    dues: project.dues?.map((due) => ({
      ...due,
      date: parseIsoDate(due.date),
    })),
  }))
}

/**
 * Cached readers for rendering — `cache` dedupes within a single render pass.
 * Server Actions use the uncached loaders below so they never mutate a stale
 * snapshot.
 */
export const readClients = cache(loadClientsUncached)
export const readProjects = cache(loadProjectsUncached)

export const loadClients = loadClientsUncached
export const loadProjects = loadProjectsUncached

export async function saveClients(clients: Client[]) {
  await writeJsonFile(clientsFile, clientsFileSchema.parse(clients))
}

export async function saveProjects(projects: Project[]) {
  const stored: StoredProject[] = projects.map((project) => ({
    ...project,
    dues: project.dues?.map((due) => ({ ...due, date: toIsoDate(due.date) })),
  }))

  await writeJsonFile(projectsFile, projectsFileSchema.parse(stored))
}
