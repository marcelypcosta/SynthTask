import { Button } from "@/ui/button";
import { Save } from "lucide-react";

type Props = {
  onClick?: () => void;
  disabled?: boolean;
};

export default function TaskSaveChangeButton({ onClick, disabled }: Props) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="bg-primary/10 text-primary hover:bg-primary/20"
    >
      <Save />
    </Button>
  );
}
