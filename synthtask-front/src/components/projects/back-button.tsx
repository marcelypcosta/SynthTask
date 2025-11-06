"use client"

import { useRouter } from "next/navigation";

import { Button } from "@/ui/button";

import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.push("/projects")}
      variant="outline"
      className="flex items-center gap-2"
    >
      <ArrowLeft size={18} />
      Voltar
    </Button>
  );
}