"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { setAccessToken } from "@/lib/http";

type Props = {
  children?: React.ReactNode;
};

function AuthTokenEffect() {
  const { data: session } = useSession();
  useEffect(() => {
    const token = (session as any)?.accessToken ?? null;
    setAccessToken(token);
  }, [session]);
  return null;
}

export const AuthProvider = ({ children }: Props) => {
  // Injeta o accessToken só após o SessionProvider estar montado
  return (
    <SessionProvider>
      <AuthTokenEffect />
      {children}
    </SessionProvider>
  );
};