"use client";

import BackButton from "@/components/projects/back-button";
import { use } from "react";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <>
      <BackButton />
      <header className="w-full flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{id}</h1>
          <p className="text-sm text-gray-500">Detalhes do projeto </p>
        </div>
      </header>
    </>
  );
}
