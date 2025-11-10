import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div
      className="w-full h-full flex justify-center items-center"
    >
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span className="text-sm">Carregando...</span>
      </div>
    </div>
  );
}