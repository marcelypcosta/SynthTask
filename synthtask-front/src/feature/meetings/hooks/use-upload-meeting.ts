import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/http";

interface ProcessedMeeting {
  id: string;
  summary: string;
  key_points: string[];
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'Alta' | 'Média' | 'Baixa';
    assignee: string | null;
    due_date: string | null;
  }>;
  created_at: string;
  sent_to_trello: boolean;
}

export default function useUploadMeeting(returnResult?: boolean) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validar tipo de arquivo
      const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Arquivo deve ser .txt, .md ou .pdf");
        setFile(null);
        return;
      }
      
      // Validar tamanho (máx 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("Arquivo muito grande (máx 10MB)");
        setFile(null);
        return;
      }
      
      setError(null);
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<ProcessedMeeting | void> => {
    e.preventDefault();
    
    if (!file) {
      setError("Selecione um arquivo");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/api/meetings/process-file", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ Reunião processada:", response.data);
      
      if (returnResult) {
        // Se pediu para retornar resultado, retorna
        setFile(null);
        return response.data as ProcessedMeeting;
      } else {
        // Se não, redireciona
        router.push(`/meetings/${response.data.id}`);
      }
      
    } catch (err: any) {
      setError(err.message || "Erro ao processar arquivo");
      console.error("Erro:", err);
    } finally {
      setIsLoading(false);
      if (!returnResult) {
        setFile(null);
      }
    }
  };

  return {
    file,
    isLoading,
    error,
    handleFileChange,
    handleSubmit,
  };
}
