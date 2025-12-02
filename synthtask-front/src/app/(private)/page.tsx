"use client";

import Link from "next/link";
import { Button } from "@/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/ui/card";
import { Separator } from "@/ui/separator";
import { SquareKanban, Puzzle, Upload, ArrowRight, Workflow } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="w-full">
      <header className="mb-6 md:mb-8">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">Bem-vindo</h1>
        <p className="text-neutral-600 text-lg max-w-xl">
          Conecte suas ferramentas e processe suas transcrições para extrair tasks de forma rápida e organizada.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
        {/* Card de Integrações */}
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow rounded-xl sm:p-6">
          <CardHeader className="px-3 sm:px-0 gap-1">
            <div className="flex items-center gap-3 mb-2">
              <Workflow className="h-6 w-6 text-primary" aria-hidden="true" />
              <CardTitle className="text-xl">Conectar Integrações</CardTitle>
            </div>
            <CardDescription className="text-neutral-600">
              Conecte Trello e Jira para enviar suas tasks automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:p-0">
            <div className="flex items-center gap-1 text-neutral-700 font-medium">
              <SquareKanban className="h-5 w-5 text-primary" aria-hidden="true" />
              <span>Trello</span>
            </div>
            <Separator />
            <div className="flex items-center gap-1 text-neutral-700 font-medium">
              <Puzzle className="h-5 w-5 text-primary" aria-hidden="true" />
              <span>Jira</span>
            </div>
            <Button asChild className="mt-3 w-full justify-center gap-2">
              <Link href="/connections">
                Ir para Conexões
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Card de Upload */}
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow rounded-xl sm:p-6">
          <CardHeader className="px-3 sm:px-0 gap-1">
            <div className="flex items-center gap-3 mb-2">
              <Upload className="h-6 w-6 text-primary" aria-hidden="true" />
              <CardTitle className="text-xl">Processar Reunião</CardTitle>
            </div>
            <CardDescription className="text-neutral-600">
              Faça upload da transcrição para identificar tarefas automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:p-0">
            <p className="text-neutral-700">
              Envie um arquivo <span className="font-medium">.txt, .docx</span> ou <span className="font-medium">.doc</span> para processamento.
            </p>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-neutral-800">Dicas rápidas</h3>
              <ul className="list-disc pl-5 text-neutral-700 text-sm">
                <li>Use transcrições com identificação dos participantes.</li>
                <li>Mantenha ações e decisões claras no texto.</li>
                <li>Prefira arquivos sem formatação excessiva para melhor leitura.</li>
              </ul>
            </div>
            <Button asChild className="mt-3 w-full justify-center gap-2">
              <Link href="/uploads">
                Ir para Uploads
                <Upload className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
