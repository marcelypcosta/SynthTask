"use client";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Button } from "@/ui/button";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";

interface NewProjectCardProps {
  id: number;
  projectName: string;
  boardName: string;
  toolName: string;
  onDelete?: (id: number) => void;
}

export default function NewProjectCard({
  id,
  projectName,
  boardName,
  toolName,
  onDelete,
}: NewProjectCardProps) {
  const router = useRouter();

  const handleRedirect = (id: number) => {
    router.push(`/projects/${id}`);
  };

  return (
    <Card className="bg-white rounded-md px-3 sm:px-0">
      <CardHeader>
        <CardTitle>{projectName}</CardTitle>
        <CardDescription>
          {boardName} - {toolName}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex gap-2">
        <Button className="flex-1" size="lg" onClick={() => handleRedirect(id)}>
          Ver projeto
        </Button>
        {onDelete && (
          <Button
            variant="outline"
            size="icon"
            className="bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
            aria-label="Excluir projeto"
            onClick={() => onDelete(id)}
          >
            <Trash />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
