import { api } from "@/lib/http";

export interface MeetingListItem {
  id: string;
  summary: string;
  file_name?: string | null;
  created_at: string;
  tasks_count: number;
  sent_to_trello: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  assignee?: string | null;
  due_date?: string | null;
}

export interface ProcessedMeeting {
  id: string;
  summary: string;
  key_points: string[];
  tasks: Task[];
  created_at: string;
  sent_to_trello: boolean;
}

export async function getMeetings(): Promise<MeetingListItem[]> {
  const res = await api.get("/api/meetings");
  return res.data;
}

export async function uploadTranscript(file: File): Promise<ProcessedMeeting> {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post("/api/meetings/process-file", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteMeeting(meetingId: string): Promise<void> {
  await api.delete(`/api/meetings/${meetingId}`);
}

export async function deleteTask(
  meetingId: string,
  taskId: string
): Promise<string> {
  const res = await api.delete(`/api/meetings/${meetingId}/tasks/${taskId}`);
  return (res.data?.message as string) ?? "Task deletada com sucesso";
}

export async function updateTask(
  meetingId: string,
  taskId: string,
  payload: {
    title: string;
    description: string;
    priority: string;
    assignee?: string | null;
    due_date?: string | null;
  }
): Promise<string> {
  const res = await api.put(`/api/meetings/${meetingId}/tasks/${taskId}`, payload);
  return (res.data?.message as string) ?? "Task atualizada com sucesso";
}
