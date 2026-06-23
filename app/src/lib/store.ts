import type { ProjectState } from "./pipeline/types";

const projects = new Map<string, ProjectState>();

export function getProject(id: string): ProjectState | undefined {
  return projects.get(id);
}

export function setProject(state: ProjectState): void {
  projects.set(state.id, state);
}

export function updateProject(
  id: string,
  update: Partial<ProjectState>
): ProjectState | undefined {
  const existing = projects.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...update };
  projects.set(id, updated);
  return updated;
}

export function listProjects(): ProjectState[] {
  return Array.from(projects.values());
}
