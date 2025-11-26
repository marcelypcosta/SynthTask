"use client";

import { Calendar, Clock, ListChecks } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/ui/card";
import { Button } from "@/ui/button";
import { formatDate, formatTime } from "@/lib/meetings";

type Props = {
  id: string;
  fileName?: string | null;
  createdAt: string;
  onReview: (id: string) => void;
};

export default function MeetingCard({
  id,
  fileName,
  createdAt,
  onReview,
}: Props) {
  return (
    <Card className="bg-white rounded-sm transition-shadow hover:shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">
          {fileName || "(Arquivo sem nome)"}
        </CardTitle>
        <CardDescription className="text-sm text-neutral-600">
          Reunião processada pelo sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm bg-primary/10">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <time dateTime={createdAt}>{formatDate(createdAt)}</time>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm bg-primary/10">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <time dateTime={createdAt}>{formatTime(createdAt)}</time>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          className="w-full gap-2 focus-visible:ring-2 focus-visible:ring-offset-2"
          onClick={() => onReview(id)}
        >
          <ListChecks className="h-4 w-4" aria-hidden="true" />
          Revisar
        </Button>
      </CardFooter>
    </Card>
  );
}
