import { Calendar, Clock, ListChecks } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Button } from "@/ui/button";

import type { Meeting } from "@/types/meetings";
import { formatDate, formatTime } from "@/lib/meetings";

export default function CardMeetings({ meeting }: { meeting: Meeting }) {
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>{meeting.name}</CardTitle>

        {meeting.description ? (
          <CardDescription className="text-sm text-muted-foreground">
            {meeting.description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm bg-primary/10">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <time dateTime={meeting.data_time ?? ""}>
            {formatDate(meeting.data_time)}
          </time>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm bg-primary/10">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <time dateTime={meeting.data_time ?? ""}>
            {formatTime(meeting.data_time)}
          </time>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button className="w-full gap-2 focus-visible:ring-2 focus-visible:ring-offset-2">
          <ListChecks className="h-4 w-4" aria-hidden="true" />
          Revisar
        </Button>
      </CardFooter>
    </Card>
  );
}
