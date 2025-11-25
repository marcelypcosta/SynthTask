"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { setAccessToken } from "@/lib/http";

import { Button } from "@/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/ui/table";

import UploadFileForm from "@/feature/upload/components/upload-file-form";
import {
  getMeetings,
  MeetingListItem,
  ProcessedMeeting,
  deleteMeeting,
} from "@/lib/meetings-api";
import { formatDate } from "@/lib/meetings";

export default function UploadsPage() {
  const { data: session, status: authStatus } = useSession();
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [lastProcessed, setLastProcessed] = useState<ProcessedMeeting | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (authStatus !== "authenticated" || !session) return;
      const token = (session as any)?.accessToken ?? null;
      if (token) setAccessToken(token);
      try {
        const data = await getMeetings();
        if (mounted) setMeetings(data);
      } catch (e: any) {
        setError(e?.message || "Falha ao carregar transcrições");
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [authStatus, session]);

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
      {error && <p className="text-destructive mb-4">{error}</p>}

      <UploadFileForm
        onUploaded={async (processed) => {
          setLastProcessed(processed);
          const data = await getMeetings();
          setMeetings(data);
        }}
        onError={(msg) => setError(msg)}
      />

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
        <h2 className="text-lg font-semibold text-neutral-800 mb-2">
          Transcrições processadas
        </h2>
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
