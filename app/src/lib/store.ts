import type { ProjectState } from "./pipeline/types";
import { VIDEOS_DIR } from "./pipeline/paths";
import fs from "fs";
import path from "path";

const projects = new Map<string, ProjectState>();
let loaded = false;

const STORE_PATH = path.join(VIDEOS_DIR, "projects.json");

function loadProjects(): void {
  if (loaded) return;
  loaded = true;

  if (!fs.existsSync(STORE_PATH)) return;

  try {
    const saved = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8")) as ProjectState[];
    if (Array.isArray(saved)) {
      for (const project of saved) {
        if (project?.id) projects.set(project.id, project);
      }
    }
  } catch {
    // Corrupt metadata should not prevent the app from opening existing project files.
  }
}

function saveProjects(): void {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  const tmpPath = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(Array.from(projects.values()), null, 2));
  fs.renameSync(tmpPath, STORE_PATH);
}

export function getProject(id: string): ProjectState | undefined {
  loadProjects();
  return projects.get(id);
}

export function setProject(state: ProjectState): void {
  loadProjects();
  projects.set(state.id, state);
  saveProjects();
}

export function updateProject(
  id: string,
  update: Partial<ProjectState>
): ProjectState | undefined {
  loadProjects();
  const existing = projects.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...update };
  projects.set(id, updated);
  saveProjects();
  return updated;
}

export function listProjects(): ProjectState[] {
  loadProjects();
  return Array.from(projects.values());
}
