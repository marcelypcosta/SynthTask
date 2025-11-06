"use client";

import { View } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/button";

interface OpenProjectDetailsButtonProps {
  id: number;
}

export default function OpenProjectDetailsButton({
  id,
}: OpenProjectDetailsButtonProps) {
  const router = useRouter();

  const handleRedirect = (id: number) => {
    router.push(`/projects/${id}`);
  };

  return (
    <Button className="w-full" onClick={() => handleRedirect(id)}>
      <View /> Ver projeto
    </Button>
  );
}
