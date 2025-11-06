'use client'

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import OpenProjectDetailsButton from "@/feature/projects/components/open-project-details-button";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>{projectName}</CardTitle>
        <CardDescription>
          {boardName} - {toolName}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <OpenProjectDetailsButton id={id} />
      </CardFooter>
    </Card>
  );
}
