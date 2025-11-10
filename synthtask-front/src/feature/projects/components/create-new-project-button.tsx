import { DialogTrigger } from "@/ui/dialog";

import { Plus } from "lucide-react";

export default function CreateNewProjectButton() {
  return (
    <DialogTrigger className="bg-primary text-white px-4 py-2 rounded-md flex items-center justify-center gap-2">
      <Plus />
      Novo projeto
    </DialogTrigger>
  );
}