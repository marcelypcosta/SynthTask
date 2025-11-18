"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/ui/table";

import {
  getMeetings,
  uploadTranscript,
  MeetingListItem,
  ProcessedMeeting,
  deleteMeeting,
} from "@/lib/meetings-api";
  import { formatDate } from "@/lib/meetings";

export default function UploadsPage() {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastProcessed, setLastProcessed] = useState<ProcessedMeeting | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getMeetings();
        if (mounted) setMeetings(data);
      } catch (e: any) {
        console.warn("Falha ao carregar transcrições:", e?.message || e);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const triggerFileSelect = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFiles = useCallback(async (files?: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const allowed = [".txt", ".docx", ".doc"];
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!allowed.includes(ext)) {
      setError(`Formato não permitido. Use: ${allowed.join(", ")}`);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const processed = await uploadTranscript(file);
      setLastProcessed(processed);
      const data = await getMeetings();
      setMeetings(data);
    } catch (e: any) {
      setError(e?.message || "Falha ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  }, []);

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      await handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );
  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      await deleteMeeting(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    } catch (e: any) {
      setError(e?.message || "Falha ao apagar transcrição");
    } finally {
      setDeletingId(null);
    }
  }, []);

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-neutral-800 mt-2">
          Upload de Transcrições
        </h1>
        <p className="text-neutral-600">
          Analise as transcrições de áudio e veja as tarefas extraídas.
        </p>
      </header>

      <div
        className="w-full bg-neutral-100 p-8 border-2 border-neutral-300 rounded-sm"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <div className="flex flex-col justify-center items-center text-center">
          <Upload className="text-primary" />
          <p className="font-semibold">Arraste e solte seu arquivo aqui</p>
          <span className="text-neutral-600">
            Ou clique para navegar pelos seus arquivos
          </span>
          <Button
            className="mt-4"
            disabled={uploading}
            onClick={triggerFileSelect}
          >
            {uploading ? "Enviando..." : "Selecionar arquivo"}
          </Button>
          {error && <p className="text-destructive mt-3">{error}</p>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.docx,.doc"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {lastProcessed && (
        <div className="w-full mt-6 p-4 border rounded-sm bg-neutral-50">
          <h2 className="text-lg font-semibold text-neutral-800 mb-2">
            Última transcrição processada
          </h2>
          <p className="text-neutral-700 mb-1">{lastProcessed.summary}</p>
          <p className="text-neutral-600 mb-2">
            Criada em: {formatDate(lastProcessed.created_at)}
          </p>
          <p className="text-neutral-600">
            Tarefas extraídas: {lastProcessed.tasks.length}
          </p>
        </div>
      )}

      <div className="w-full mt-6">
        <h2 className="text-lg font-semibold text-neutral-800 mb-2">Transcrições processadas</h2>
        <Table className="border border-neutral-300 rounded-sm">
          <TableHeader className="bg-neutral-100">
            <TableRow>
              <TableHead className="w-[50%]">Transcrições</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Tarefas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">
                  {m.file_name || "(Arquivo sem nome)"} 
                </TableCell>
                <TableCell>{formatDate(m.created_at)}</TableCell>
                <TableCell className="text-right">{m.tasks_count}</TableCell>
                <TableCell className="text-right">
                  <Button
                    className="bg-destructive/10 hover:bg-destructive/20 text-destructive"
                    disabled={deletingId === m.id}
                    onClick={() => handleDelete(m.id)}
                  >
                    Apagar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {meetings.length === 0 && (
              <TableRow>
                <TableCell className="text-neutral-600" colSpan={4}>
                  Nenhuma transcrição processada ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
