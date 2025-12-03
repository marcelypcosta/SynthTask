import { useState } from "react";
import { signOut } from "next-auth/react";
import { Loader2, LogOut } from "lucide-react";
import { SidebarMenuButton } from "@/ui/sidebar";

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
      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive group"
    >
      {loggingOut ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4 group-hover:text-destructive" />
      )}
      <span>{loggingOut ? "Saindo..." : "Sair da conta"}</span>
    </SidebarMenuButton>
  );
}
