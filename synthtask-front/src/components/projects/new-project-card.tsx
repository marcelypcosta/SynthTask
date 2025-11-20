"use client";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Button } from "@/ui/button";
import { View, Trash } from "lucide-react";
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
    <Card>
      <CardHeader>
        <CardTitle>{projectName}</CardTitle>
        <CardDescription>
          {boardName} - {toolName}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex gap-2">
        <Button className="flex-1" onClick={() => handleRedirect(id)}>
          <View /> Ver projeto
        </Button>
        {onDelete && (
          <Button variant="destructive" className="flex-1" onClick={() => onDelete(id)}>
            <Trash /> Excluir
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
