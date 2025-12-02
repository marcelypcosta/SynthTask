import { api } from "@/lib/http";
import type { Provider } from "@/types/providers";

export interface ProjectListItem {
  id: number;
  name: string;
  provider: Provider;
  target_id: string;
  target_name?: string | null;
  created_at: string;
}

export async function getProjects(): Promise<ProjectListItem[]> {
  const res = await api.get("/api/projects");
  return res.data;
}

export async function createProject(payload: {
  name: string;
  provider: Provider;
  target_id: string;
  target_name?: string;
}): Promise<ProjectListItem> {
  const res = await api.post("/api/projects", payload);
  return res.data;
}

export async function getProject(id: number): Promise<ProjectListItem> {
  const res = await api.get(`/api/projects/${id}`);
  return res.data;
}

export async function updateProjectTarget(
  id: number,
  payload: { target_id: string; target_name?: string; provider?: Provider }
): Promise<ProjectListItem> {
  const res = await api.put(`/api/projects/${id}` , payload);
  return res.data;
}

export async function deleteProject(id: number): Promise<void> {
  await api.delete(`/api/projects/${id}`);
}