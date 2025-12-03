"use client";

import Link from "next/link";
import { Button } from "@/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/ui/card";
import {
  SquareKanban,
  Puzzle,
  Upload,
  ArrowRight,
  Workflow,
  CheckCircle2,
  FileText,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Bem-vindo ao SynthTask
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Conecte suas ferramentas e processe suas transcrições para
            automatizar seu fluxo de trabalho.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <Card className="border-border/50 shadow-lg flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-100/50 dark:bg-blue-900/20">
                  <Workflow
                    className="h-6 w-6 text-[#3B82F6]"
                    aria-hidden="true"
                  />
                </div>
                <CardTitle className="text-xl">Conectar Integrações</CardTitle>
              </div>
              <CardDescription>
                Vincule o Trello e Jira para enviar suas tasks automaticamente
                após o processamento.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <div className="rounded-lg border p-3 flex items-center gap-3 bg-background/50">
                <SquareKanban className="h-5 w-5 text-[#3B82F6] flex-shrink-0" />
                <span className="font-medium">Trello</span>
              </div>

              <div className="rounded-lg border p-3 flex items-center gap-3 bg-background/50">
                <Puzzle className="h-5 w-5 text-[#3B82F6] flex-shrink-0" />
                <span className="font-medium">Jira</span>
              </div>

              <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3 flex items-center justify-center gap-2 bg-muted/20 text-muted-foreground">
                <span className="text-sm font-medium">Mais em breve</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                className="w-full gap-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white"
              >
                <Link href="/connections">
                  Gerenciar Conexões
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-border/50 shadow-lg flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-100/50 dark:bg-blue-900/20">
                  <Upload
                    className="h-6 w-6 text-[#3B82F6]"
                    aria-hidden="true"
                  />
                </div>
                <CardTitle className="text-xl">Processar Reunião</CardTitle>
              </div>
              <CardDescription>
                Faça upload da transcrição e nossa IA identificará as tarefas
                automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-black/5 text-sm text-muted-foreground">
                <FileText className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p>
                  Formatos suportados:{" "}
                  <span className="font-medium text-foreground">
                    .txt, .docx, .doc
                  </span>
                  .
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">
                  Para melhores resultados:
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    Identifique os participantes na transcrição.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    Mantenha ações e decisões claras no texto.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    Evite formatação excessiva no arquivo.
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                className="w-full gap-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white"
              >
                <Link href="/uploads">
                  Novo Upload
                  <Upload className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}
