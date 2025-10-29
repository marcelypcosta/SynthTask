"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { setAccessToken } from "@/lib/http";

type Props = {
  children?: React.ReactNode;
};

function SessionManager({ children }: Props) {
  const { data: session } = useSession();

  useEffect(() => {
    const token = (session as any)?.accessToken;
    if (token) {
      setAccessToken(token);
    }
  }, [session]);

  return <>{children}</>;
}

export const AuthProvider = ({ children }: Props) => {
  return (
    <SessionProvider>
      <SessionManager>
        {children}
      </SessionManager>
    </SessionProvider>
  );
};