import { Button } from "@/ui/button";
import { Cable } from "lucide-react";

export default function ToolIntegrationButton({
  connected,
}: {
  connected: boolean;
}) {
  return (
    <Button
      className={`bg-primary/10 text-primary rounded-sm hover:bg-primary/20 ${
        connected
          ? "bg-destructive/10 hover:bg-destructive/20 text-destructive-foreground text-destructive"
          : ""
      }`}
    >
      <Cable className="w-8 h-8" /> {connected ? "Desconectar" : "Conectar"}
    </Button>
  );
}
