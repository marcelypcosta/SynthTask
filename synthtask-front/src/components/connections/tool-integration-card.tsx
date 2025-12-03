import { Button } from "@/ui/button";
import { Loader2, Puzzle, SquareKanban, Link2, Plug } from "lucide-react";
import { Provider } from "@/types/providers";

interface ToolIntegrationCardProps {
  toolName: string;
  provider: Provider | string;
  connected: boolean;
  accountEmail?: string;
  onClick?: () => void;
  loading?: boolean;
}

export default function ToolIntegrationCard({
  toolName,
  provider,
  connected,
  accountEmail,
  onClick,
  loading,
}: ToolIntegrationCardProps) {
  const getIcon = (p: string) => {
    switch (p.toLowerCase()) {
      case "trello":
        return SquareKanban;
      case "jira":
        return Puzzle;
      default:
        return Link2;
    }
  };

  const Icon = getIcon(provider as string);

  return (
    <div
      className="
      group flex flex-col gap-4 rounded-xl border border-border/50 bg-white p-4 shadow-sm transition-all hover:shadow-md
      sm:flex-row sm:items-center sm:justify-between sm:gap-6
    "
    >
      {/* Esquerda: Ícone e Texto */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-neutral-100 group-hover:bg-neutral-50 transition-colors">
          <Icon className="h-6 w-6 text-[#3B82F6]" />
        </div>

        <div className="flex flex-col gap-0.5">
          <h3 className="font-semibold text-neutral-900 leading-none">
            {toolName}
          </h3>
          <p className="text-sm text-neutral-500 leading-snug">
            {connected
              ? accountEmail
                ? "Conta conectada"
                : "Conta conectada"
              : `Nenhuma conta conectada ao ${toolName}`}
          </p>
        </div>
      </div>

      {/* Direita: Botão (Mobile: Abaixo e Full / Desktop: Ao lado e Auto) */}
      <div className="mt-auto sm:mt-0 w-full sm:w-auto">
        <Button
          variant="ghost"
          onClick={onClick}
          disabled={loading}
          className={`
            w-full sm:w-auto sm:min-w-[140px] h-10 gap-2 font-medium transition-colors
            ${
              connected
                ? "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                : "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
            }
          `}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : connected ? (
            <>
              <Plug className="h-4 w-4 rotate-45" />
              Desconectar
            </>
          ) : (
            <>
              <Plug className="h-4 w-4" />
              Conectar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
