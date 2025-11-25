"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/ui/button";
import type { ProcessedMeeting } from "@/lib/meetings-api";
import useUpload from "@/feature/upload/hooks/use-upload";

type Props = {
  onUploaded: (processed: ProcessedMeeting) => void;
  onError?: (message: string) => void;
};

export default function UploadFileForm({ onUploaded, onError }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    selectedFile,
    uploading,
    error,
    allowedExtensions,
    selectFile,
    clearSelection,
    startUpload,
    setError,
  } = useUpload();

  const triggerFileSelect = () => inputRef.current?.click();

  const handleInputChange = (files?: FileList | null) => {
    const file = files && files[0] ? files[0] : null;
    selectFile(file);
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    const file = files && files[0] ? files[0] : null;
    selectFile(file);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const send = async () => {
    try {
      const processed = await startUpload();
      onUploaded(processed);
      clearSelection();
    } catch (e: any) {
      const message = e?.message || "Falha ao enviar arquivo";
      setError(message);
      onError?.(message);
    }
  };

  return (
    <div
      className="w-full bg-neutral-100 p-8 border-2 border-neutral-300 rounded-sm"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <div className="flex flex-col justify-center items-center text-center">
        <Upload className="text-primary" />
        {!selectedFile && (
          <>
            <p className="font-semibold">Arraste e solte seu arquivo aqui</p>
            <span className="text-neutral-600">
              Ou clique para navegar pelos seus arquivos
            </span>
          </>
        )}
        {selectedFile && (
          <>
            <p className="font-semibold">Arquivo selecionado</p>
            <span className="text-neutral-700">{selectedFile.name}</span>
          </>
        )}
        <span className="text-sm text-neutral-500 mt-2">
          Apenas arquivos: {allowedExtensions.join(", ")}
        </span>
        <div className="flex gap-3 mt-4">
          {!selectedFile && (
            <Button disabled={uploading} onClick={triggerFileSelect}>
              Selecionar arquivo
            </Button>
          )}
          {selectedFile && (
            <Button
              className="bg-primary text-white"
              disabled={uploading}
              onClick={send}
            >
              {uploading ? "Enviando..." : "Enviar"}
            </Button>
          )}
          {selectedFile && (
            <Button
              className="bg-neutral-200 text-neutral-800 hover:bg-neutral-300"
              disabled={uploading}
              onClick={clearSelection}
            >
              Limpar seleção
            </Button>
          )}
        </div>

        {error && <p className="text-destructive mt-3">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.docx,.doc"
        className="hidden"
        onChange={(e) => handleInputChange(e.target.files)}
      />
    </div>
  );
}
