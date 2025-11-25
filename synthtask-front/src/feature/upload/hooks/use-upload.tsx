"use client";

import { useCallback, useState } from "react";
import { uploadTranscript, ProcessedMeeting } from "@/lib/meetings-api";

export default function useUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedExtensions = [".txt", ".docx", ".doc"];

  const selectFile = useCallback((file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setError(null);
      return;
    }
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setSelectedFile(null);
      setError(`Formato não permitido. Use: ${allowedExtensions.join(", ")}`);
      return;
    }
    setSelectedFile(file);
    setError(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  const startUpload = useCallback(async (): Promise<ProcessedMeeting> => {
    if (!selectedFile) {
      throw new Error("Nenhum arquivo selecionado");
    }
    setUploading(true);
    try {
      const processed = await uploadTranscript(selectedFile);
      return processed;
    } finally {
      setUploading(false);
    }
  }, [selectedFile]);

  return {
    selectedFile,
    uploading,
    error,
    allowedExtensions,
    selectFile,
    clearSelection,
    startUpload,
    setError,
  };
}
