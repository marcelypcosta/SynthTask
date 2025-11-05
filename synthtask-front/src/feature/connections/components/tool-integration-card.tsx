import { Button } from "@/ui/button";
import { Cable, KanbanSquare } from "lucide-react";

interface ToolIntegrationCardProps {
  toolName: string;
  connected: boolean;
}

export default function ToolIntegrationCard({
  toolName,
  connected,
}: ToolIntegrationCardProps) {
  return (
    <div className="w-full flex items-center justify-between gap-2 border border-neutral-300 rounded-sm p-2">
      <div className="flex items-center gap-2">
        <div className="bg-neutral-100 p-2 rounded-sm">
          <KanbanSquare className="w-8 h-8 text-primary" />
        </div>
        <div>
          <p className="font-medium text-md">{toolName}</p>
          <span className="text-neutral-600 text-sm">
            {connected ? "Conta conectada" : "Nenhuma conta conectada"}
          </span>
        </div>
      </div>
      <Button
        className={`bg-primary/10 text-primary rounded-sm hover:bg-primary/20 ${
          connected
            ? "bg-destructive/10 hover:bg-destructive/20 text-destructive-foreground text-destructive"
            : ""
        }`}
      >
        <Cable className="w-8 h-8" /> {connected ? "Desconectar" : "Conectar"}
      </Button>
    </div>
  );
}
