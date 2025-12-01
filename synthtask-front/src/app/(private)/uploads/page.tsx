"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { setAccessToken } from "@/lib/http";
import { toast } from "sonner";

import { Button } from "@/ui/button";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/ui/table";

import UploadFileForm from "@/feature/upload/components/upload-file-form";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

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
        const msg = e?.message || "Falha ao carregar transcrições";
        setError(msg);
        toast.error(msg);
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
      toast.success("Transcrição apagada com sucesso");
    } catch (e: any) {
      const msg = e?.message || "Falha ao apagar transcrição";
      setError(msg);
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  }, []);

  const openConfirmDelete = (id: string) => {
    setConfirmId(id);
    toast.warning("Confirme a exclusão da transcrição.");
    setConfirmOpen(true);
  };

  return (
    <>
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
            toast.success("Transcrição processada com sucesso");
          }}
          onError={(msg) => {
            setError(msg);
            toast.error(msg);
          }}
        />

        {lastProcessed && (
          <div className="w-full mt-6 p-4 border rounded-sm bg-neutral-50">
            <h2 className="text-lg font-semibold text-neutral-800 mb-2">
              Última transcrição processada
            </h2>
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
                      className="bg-destructive/10 hover:bg-destructive/20 text-destructive gap-2"
                      disabled={deletingId === m.id}
                      onClick={() => openConfirmDelete(m.id)}
                    >
                      {deletingId === m.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
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

      <Dialog open={confirmOpen} onOpenChange={(o) => setConfirmOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apagar transcrição</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-600">Tem certeza que deseja apagar esta transcrição?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setConfirmOpen(false);
                if (confirmId) await handleDelete(confirmId);
                setConfirmId(null);
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
