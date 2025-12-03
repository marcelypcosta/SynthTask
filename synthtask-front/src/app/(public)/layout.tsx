import { Zap } from "lucide-react";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#3B82F6]">
            <Zap className="h-5 w-5 text-white fill-white" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-2xl font-bold tracking-tight">SynthTask</span>
            <span className="text-sm font font-medium text-black/50">
              Automação Inteligente
            </span>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
