import useUploadMeeting from "../hooks/use-upload-meeting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

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

interface MeetingUploadFormProps {
  onSuccess?: (result: ProcessedMeeting) => void;
}

export default function MeetingUploadForm({ onSuccess }: MeetingUploadFormProps) {
  const { file, isLoading, error, handleFileChange, handleSubmit: handleFormSubmit } = useUploadMeeting(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await handleFormSubmit(e);
    if (result && onSuccess) {
      onSuccess(result);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Upload de Reunião</h1>
        <p className="text-sm text-gray-600">
          Envie um arquivo de texto com a transcrição ou notas da reunião
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input de arquivo */}
          <div className="space-y-2">
            <label htmlFor="file-upload" className="text-sm font-medium">
              Selecione um arquivo
            </label>
            <Input
              id="file-upload"
              type="file"
              accept=".txt,.md,.pdf"
              onChange={handleFileChange}
              disabled={isLoading}
              className="cursor-pointer"
            />
            <p className="text-xs text-gray-500">
              Formatos aceitos: .txt, .md, .pdf (máx 10MB)
            </p>
          </div>

          {/* Mostrar nome do arquivo selecionado */}
          {file && (
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm font-medium text-blue-900">
                📄 {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            </div>
          )}

          {/* Mostrar erro */}
          {error && (
            <div className="p-3 bg-red-50 rounded border border-red-200">
              <p className="text-sm font-medium text-red-900">❌ {error}</p>
            </div>
          )}

          {/* Botão de submit */}
          <Button
            type="submit"
            disabled={!file || isLoading}
            className="w-full"
          >
            {isLoading ? "Processando..." : "Processar Reunião"}
          </Button>
        </form>

        {/* Informações adicionais */}
        <div className="p-3 bg-gray-50 rounded text-xs text-gray-600 space-y-1">
          <p>💡 Dica: Você pode:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Copiar transcrição de Zoom/Teams para um arquivo .txt</li>
            <li>Enviar notas manuscritas (convertidas para .txt)</li>
            <li>Compartilhar documentos de reunião em .md</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
