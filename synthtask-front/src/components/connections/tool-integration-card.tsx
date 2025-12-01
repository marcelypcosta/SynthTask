import { KanbanSquare } from "lucide-react";
import ToolIntegrationButton from "../../feature/connections/components/tool-integration-button";

interface ToolIntegrationCardProps {
  toolName: string;
  connected: boolean;
  accountEmail?: string;
  onClick?: () => void;
  loading?: boolean;
}

export default function ToolIntegrationCard({
  toolName,
  connected,
  accountEmail,
  onClick,
  loading,
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
            {connected ? (accountEmail ? `Conectado como ${accountEmail}` : "Conta conectada") : "Nenhuma conta conectada"}
          </span>
        </div>
      </div>
      <ToolIntegrationButton connected={connected} onClick={onClick} loading={loading} />
    </div>
  );
}
