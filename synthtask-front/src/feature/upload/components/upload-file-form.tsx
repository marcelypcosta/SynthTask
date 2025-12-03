"use client";

import { useRef, useState } from "react";
import { CloudUpload, FileText, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/ui/button";
import type { ProcessedMeeting } from "@/lib/meetings-api";
import useUpload from "@/feature/upload/hooks/use-upload";

type Props = {
  onUploaded: (processed: ProcessedMeeting) => void;
  onError?: (message: string) => void;
};

export default function UploadFileForm({ onUploaded, onError }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

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

  const triggerFileSelect = () => {
    if (!uploading) inputRef.current?.click();
  };

  const handleInputChange = (files?: FileList | null) => {
    const file = files && files[0] ? files[0] : null;
    selectFile(file);
  };

  // Drag & Drop Handlers
  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setIsDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (uploading) return;

    const files = e.dataTransfer.files;
    const file = files && files[0] ? files[0] : null;
    selectFile(file);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
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
    <div className="w-full space-y-4">
      <div
        onClick={!selectedFile ? triggerFileSelect : undefined}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`
          relative flex flex-col items-center justify-center w-full rounded-xl transition-all duration-200 overflow-hidden border-2
          ${
            isDragActive
              ? "border-dashed border-[#3B82F6] bg-white" 
              : !selectedFile
              ? "border-dashed border-neutral-300 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-400 cursor-pointer py-12" 
              : "border-solid border-transparent bg-neutral-100/80 p-4" 
          }
          ${
            error && !selectedFile
              ? "border-dashed border-destructive/50 bg-destructive/5"
              : ""
          }
        `}
      >
        {!selectedFile ? (
          <div className="flex flex-col items-center gap-3 text-center animate-in fade-in zoom-in duration-300">
            <div className="p-3 bg-white rounded-full shadow-sm border border-neutral-100">
              <CloudUpload className="h-6 w-6 text-[#3B82F6]" />
            </div>

            <div className="space-y-1">
              <p className="text-base font-semibold text-neutral-900">
                Arraste e solte o arquivo aqui
              </p>
              <p className="text-sm text-neutral-500">
                ou{" "}
                <span className="text-[#3B82F6] hover:underline">
                  clique para selecionar
                </span>
              </p>
            </div>

            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide mt-2">
              {allowedExtensions.join(", ").replace(/\./g, "")}
            </p>
          </div>
        ) : (
          <div className="w-full flex items-center gap-4 bg-white p-3 rounded-md shadow-sm border border-neutral-200/60 animate-in slide-in-from-bottom-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#3B82F6]/10">
              <FileText className="h-5 w-5 text-[#3B82F6]" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-neutral-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
              disabled={uploading}
              className="text-neutral-400 hover:text-destructive hover:bg-destructive/10 shrink-0"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        )}

        {error && !selectedFile && (
          <p className="absolute bottom-4 text-xs font-medium text-destructive">
            {error}
          </p>
        )}
      </div>

      <Button
        onClick={send}
        disabled={!selectedFile || uploading}
        className={`
          w-full h-11 text-base font-medium transition-all
          ${
            !selectedFile || uploading
              ? "bg-neutral-200 text-neutral-400 hover:bg-neutral-200 cursor-not-allowed"
              : "bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white shadow-sm"
          }
        `}
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          "Enviar documento"
        )}
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept={allowedExtensions.join(",")}
        className="hidden"
        onChange={(e) => handleInputChange(e.target.files)}
      />
    </div>
  );
}
