"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { setAccessToken } from "@/lib/http";
import { toast } from "sonner";
import {
  Loader2,
  Trash2,
  FileText,
  CheckCircle2,
  History,
} from "lucide-react";

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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/ui/dialog";

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
  const [loadingInitial, setLoadingInitial] = useState(true);

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
        toast.error("Falha ao carregar histórico de transcrições");
      } finally {
        if (mounted) setLoadingInitial(false);
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
      toast.success("Transcrição removida");
    } catch (e: any) {
      toast.error("Erro ao apagar transcrição");
    } finally {
      setDeletingId(null);
    }
  }, []);

  const openConfirmDelete = (id: string) => {
    setConfirmId(id);
    setConfirmOpen(true);
  };

  return (
    <main className="flex min-h-svh flex-col items-center p-6 md:p-10">
      <div className="w-full max-w-5xl space-y-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Upload de Transcrições
          </h1>
          <p className="text-lg text-muted-foreground">
            Envie seus arquivos de áudio transcritos para que nossa IA extraia
            as tarefas e automatize seu fluxo no Jira e Trello.
          </p>
        </header>

        <div className="grid gap-6">
          <UploadFileForm
            onUploaded={async (processed) => {
              setLastProcessed(processed);
              const data = await getMeetings();
              setMeetings(data);
              toast.success("Arquivo processado com sucesso!");
            }}
            onError={(msg) => toast.error(msg)}
          />

          {lastProcessed && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 rounded-xl border border-green-200 bg-green-50 p-4 dark:bg-green-900/20 dark:border-green-900">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-green-900 dark:text-green-300">
                    Processamento Concluído
                  </h3>
                  <p className="text-green-700 dark:text-green-400 text-sm">
                    Arquivo processado em {formatDate(lastProcessed.created_at)}
                    . Foram identificadas{" "}
                    <span className="font-bold">
                      {lastProcessed.tasks.length} tarefas
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">
                Histórico de Arquivos
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Gerencie suas transcrições anteriores e verifique o status de
              envio.
            </p>
          </div>

          <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-muted/30">
                  <TableHead className="w-[40%]">Arquivo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Tarefas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingInitial ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando histórico...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : meetings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhuma transcrição encontrada. Faça seu primeiro upload
                      acima.
                    </TableCell>
                  </TableRow>
                ) : (
                  meetings.map((m) => (
                    <TableRow key={m.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="rounded-md bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-foreground">
                            {m.file_name || "Sem nome"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(m.created_at)}
                      </TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                            m.sent
                              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/30 dark:text-green-400"
                              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {m.sent ? "Enviado" : "Pendente"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {m.tasks_count}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          disabled={deletingId === m.id}
                          onClick={() => openConfirmDelete(m.id)}
                        >
                          {deletingId === m.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="sr-only">Apagar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Dialog de Confirmação */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Transcrição</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover este arquivo do histórico? As
              tarefas geradas não serão apagadas das ferramentas conectadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setConfirmOpen(false);
                if (confirmId) await handleDelete(confirmId);
                setConfirmId(null);
              }}
            >
              Excluir permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}