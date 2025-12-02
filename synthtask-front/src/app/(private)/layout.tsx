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
      <main className="w-full flex flex-col justify-start items-start min-h-svh px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <SidebarTrigger className="sm:hidden" />
        <div className="w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
