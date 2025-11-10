export interface Task {
  id: number;
  name: string;
  description: string;
  status: string;
}

export interface Meeting {
  id: number;
  name: string;
  description?: string | null; 
  data_time: string;
  tasks: Task[];
}