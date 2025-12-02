import { Button } from "@/ui/button";
import { Trash } from "lucide-react";

type Props = {
  onClick?: () => void;
  disabled?: boolean;
};

export default function TaskDeleteButton({ onClick, disabled }: Props) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="bg-destructive/10 text-destructive hover:bg-destructive/20"
    >
      <Trash /> 
    </Button>
  );
}
