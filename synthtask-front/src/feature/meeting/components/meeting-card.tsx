"use client";

import {
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { formatDate, formatTime } from "@/lib/meetings";

type Props = {
  id: string;
  fileName?: string | null;
  createdAt: string;
  sent?: boolean;
  onReview: (id: string) => void;
};

export default function MeetingCard({
  id,
  fileName,
  createdAt,
  sent = false,
  onReview,
}: Props) {
  return (
    <Card className="group transition-all hover:shadow-md border-border/50 bg-white">
      <CardHeader>
        {/* Alterado para flex-col no mobile e sm:flex-row no desktop */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Container do Título e Descrição */}
          <div className="space-y-1.5 overflow-hidden w-full">
            <CardTitle
              className="text-base font-semibold truncate leading-tight"
              title={fileName || ""}
            >
              {fileName || "(Arquivo sem nome)"}
            </CardTitle>

            <CardDescription className="flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(createdAt)}
              </span>
            </CardDescription>
          </div>

          {/* Container do Badge (Action) */}
          <div className="shrink-0 self-start sm:self-auto">
            {sent ? (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1"
              >
                <CheckCircle2 className="h-3 w-3" /> Enviado
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-amber-600 bg-amber-50 border-amber-200 gap-1"
              >
                <Clock3 className="h-3 w-3" /> Pendente
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardFooter className="pt-0">
        <Button
          className={`w-full gap-2 transition-colors h-10 ${
            sent
              ? "bg-muted text-muted-foreground hover:bg-muted"
              : "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
          }`}
          disabled={Boolean(sent)}
          variant={sent ? "ghost" : "default"}
          onClick={() => {
            if (!sent) onReview(id);
          }}
        >
          {sent ? "Processado" : "Revisar Tasks"}
          {!sent && <ArrowRight className="h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
}
