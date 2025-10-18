import { AppSidebar } from "@/components/navbar/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-col justify-start items-start h-screen p-4">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
}
