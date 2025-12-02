import { Button } from "@/ui/button";
import { Plus, Loader2 } from "lucide-react";

type Props = {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export default function CreateNewTaskButton({ onClick, disabled, loading }: Props) {
  return (
    <Button onClick={onClick} disabled={disabled} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      Adicionar Tarefas
    </Button>
  );
}
