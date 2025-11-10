"use client";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Button } from "@/ui/button";
import { View } from "lucide-react";
import { useRouter } from "next/navigation";

interface NewProjectCardProps {
  id: number;
  projectName: string;
  boardName: string;
  toolName: string;
}

export default function NewProjectCard({
  id,
  projectName,
  boardName,
  toolName,
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
      <CardFooter>
        <Button className="w-full" onClick={() => handleRedirect(id)}>
          <View /> Ver projeto
        </Button>
      </CardFooter>
    </Card>
  );
}
