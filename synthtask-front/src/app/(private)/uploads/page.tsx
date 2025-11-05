import { Trash, Upload, X } from "lucide-react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { Button } from "@/ui/button";

interface Transcriptions {
  id: string;
  fileName: string;
  date: string;
  actions: string;
}

const transcriptions: Transcriptions[] = [
  {
    id: "TRCC001",
    fileName: "transcription-001.txt",
    date: "08/10/2025",
    actions: "Deletar",
  },
  {
    id: "TRCC002",
    fileName: "transcription-002.txt",
    date: "09/10/2025",
    actions: "Deletar",
  },
  {
    id: "TRCC003",
    fileName: "transcription-003.txt",
    date: "10/10/2025",
    actions: "Deletar",
  },
];

export default function UploadsPage() {
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
      <div className="w-full bg-neutral-100 p-8 border-2 border-neutral-300 rounded-sm">
        <div className="flex flex-col justify-center items-center text-center">
          <Upload className="text-primary" />
          <p className="font-semibold">Arraste e solte seu arquivo aqui</p>
          <span className="text-neutral-600">
            Ou clique para navegar pelos seus arquivos
          </span>
          <Button className="mt-4">Selecionar arquivo</Button>
        </div>
      </div>
      <div className="w-full mt-6">
        <h2 className="text-lg font-semibold text-neutral-800 mb-2">
          Transcrições baixadas
        </h2>
        <Table className="border border-neutral-300 rounded-sm">
          <TableHeader className="bg-neutral-100">
            <TableRow>
              <TableHead className="w-[100px]">Transcrições</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transcriptions.map((transcription) => (
              <TableRow key={transcription.id}>
                <TableCell className="font-medium">
                  {transcription.fileName}
                </TableCell>
                <TableCell>{transcription.date}</TableCell>
                <TableCell className="text-right">
                  <Button className="bg-destructive/10 hover:bg-destructive/20 text-destructive">
                    <Trash className="text-destructive" />
                    Apagar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
