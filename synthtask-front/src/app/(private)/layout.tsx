import { AppSidebar } from "@/components/navbar/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/ui/sidebar";

export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full flex flex-col justify-start items-start h-screen p-6">
        <SidebarTrigger className="sm:hidden" />
        {children}
      </main>
    </SidebarProvider>
  );
}
