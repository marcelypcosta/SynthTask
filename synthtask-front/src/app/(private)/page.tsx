"use client";

import { useSession, signOut } from "next-auth/react";
import { Suspense } from "react";
import Loading from "./loading";

export default function DashboardPage() {
  const { data: session } = useSession();

  if (session) {
    return (
      <>
        <p>
          {session.user?.name}{" "}
          <span className="text-neutral-500">({session.user?.email})</span>
        </p>
        <button
          onClick={() => signOut()}
          className="bg-red-500 text-white px-4 py-2 rounded-md"
        >
          Sair
        </button>
      </>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <p>Você não está logado.</p>
    </Suspense>
  );
}
