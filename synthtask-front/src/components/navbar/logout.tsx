import { useState } from "react";
import { signOut } from "next-auth/react";
import { Loader2, LogOutIcon } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export default function LogoutButton() {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut({ callbackUrl: "/sign-in" });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <SidebarMenuButton
      onClick={handleLogout}
      disabled={loggingOut}
      aria-busy={loggingOut}
      aria-label="Encerrar sessão"
      className="text-destructive hover:!bg-destructive/10 hover:!text-destructive active:!bg-destructive/10 active:!text-destructive"
    >
      {loggingOut ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <LogOutIcon className="size-4" />
      )}
      <span>{loggingOut ? "Saindo..." : "Sair"}</span>
    </SidebarMenuButton>
  );
}
