"use client";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Button } from "@/ui/button";
import { Trash2, ArrowRight, SquareKanban, Puzzle, Layout } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/ui/badge";

interface NewProjectCardProps {
  id: number;
  projectName: string;
  boardName: string;
  toolName: string;
  provider?: string;
  onDelete?: (id: number) => void;
}

export default function NewProjectCard({
  id,
  projectName,
  boardName,
  toolName,
  provider,
  onDelete,
}: NewProjectCardProps) {
  const router = useRouter();

  const handleRedirect = () => {
    router.push(`/projects/${id}`);
  };

  // Helper de ícone
  const getProviderIcon = () => {
    switch (provider?.toLowerCase()) {
      case "trello":
        return <SquareKanban className="h-3.5 w-3.5" />;
      case "jira":
        return <Puzzle className="h-3.5 w-3.5" />;
      default:
        return <Layout className="h-3.5 w-3.5" />;
    }
  };

  return (
    <Card className="group flex flex-col justify-between border-border/50 shadow-sm hover:shadow-md transition-all bg-white h-full">
      <CardHeader>
        <div className="flex justify-between items-start gap-3">
          <div className="space-y-1.5">
            <CardTitle
              className="text-lg font-bold leading-tight line-clamp-1"
              title={projectName}
            >
              {projectName}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-sm">
              {boardName}
            </CardDescription>
          </div>
          {/* Badge da Ferramenta */}
          <Badge
            variant="outline"
            className="gap-1.5 font-normal capitalize shrink-0 bg-neutral-50 text-neutral-600 border-neutral-200"
          >
            {getProviderIcon()}
            {toolName}
          </Badge>
        </div>
      </CardHeader>

      <CardFooter className="flex gap-3 pt-0 mt-auto">
        <Button
          className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 gap-2 font-medium h-9"
          onClick={handleRedirect}
        >
          Acessar
          <ArrowRight className="h-4 w-4" />
        </Button>

        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:bg-red-50 hover:text-red-600 shrink-0"
            aria-label="Excluir projeto"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
