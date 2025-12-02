"use client";

import { Calendar, Clock, ListChecks, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/ui/card";
import { Button } from "@/ui/button";
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
    <Card className="bg-white rounded-sm transition-shadow hover:shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">
          {fileName || "(Arquivo sem nome)"}
        </CardTitle>
        <CardDescription className="text-sm text-neutral-600">
          Reunião processada pelo sistema
        </CardDescription>
        <CardAction>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-sm ${
              sent
                ? "bg-green-100 text-green-700"
                : "bg-neutral-200 text-neutral-700"
            }`}
          >
            <CheckCircle2
              className={`h-4 w-4 ${
                sent ? "text-green-600" : "text-neutral-600"
              }`}
            />
            {sent ? "Tasks enviadas" : "Tasks não enviadas"}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3  text-sm bg-black/5">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <time dateTime={createdAt}>{formatDate(createdAt)}</time>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-sm bg-black/5">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <time dateTime={createdAt}>{formatTime(createdAt)}</time>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full gap-2 focus-visible:ring-2 focus-visible:ring-offset-2"
          disabled={Boolean(sent)}
          onClick={() => {
            if (!sent) onReview(id);
          }}
        >
          <ListChecks className="h-4 w-4" aria-hidden="true" />
          Revisar
        </Button>
      </CardFooter>
    </Card>
  );
}
