export type SendingTask = {
  title: string;
  description?: string | null;
  due_date?: string | null;
  assignee?: string | null;
};

export type SendTasksResultItem = {
  title: string;
  trelloCardUrl: string | null;
  jiraIssueUrl: string | null;
  assignee: string | null;
  errors?: { trello?: string | null; jira?: string | null } | null;
};

export type SendTasksResponse = {
  results: SendTasksResultItem[];
};
