import { Button } from "@/ui/button";
import { Cable, Loader2 } from "lucide-react";

export default function ToolIntegrationButton({
  connected,
  onClick,
  loading = false,
}: {
  connected: boolean;
  onClick?: () => void;
  loading?: boolean;
}) {
  return (
    <Button
      className={`bg-primary/10 text-primary rounded-sm hover:bg-primary/20 ${
        connected
          ? "bg-destructive/10 hover:bg-destructive/20 text-destructive-foreground text-destructive"
          : ""
      }`}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Cable className="w-5 h-5" />
      )}
      {loading
        ? connected
          ? "Desconectando..."
          : "Conectando..."
        : connected
        ? "Desconectar"
        : "Conectar"}
    </Button>
  );
}
