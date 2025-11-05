"use client";

import * as React from "react";

import {
  Folders,
  LayoutDashboard,
  LogOut,
  Settings,
  UploadIcon,
  Workflow,
  Zap,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/ui/sidebar";

import { NavMain } from "@/components/navbar/nav-main";
import { NavUser } from "@/components/navbar/nav-user";
import { NavSecondary } from "@/components/navbar/nav-secondary";

const data = {
  user: {
    name: "Nome Completo",
    email: "email@exemplo.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Conexões",
      url: "/connections",
      icon: Workflow,
    },
    {
      title: "Upload de Transcrições",
      url: "/uploads",
      icon: UploadIcon,
    },
    {
      title: "Meus Projetos",
      url: "/projects",
      icon: Folders,
    },
  ],
  navSecondary: [
    {
      title: "Configurações",
      url: "/settings",
      icon: Settings,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <Zap className="!size-5" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-md font-semibold">SynthTask</span>
              <span className="text-xs text-muted-foreground">Automação Inteligente</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={data.navMain.map((item) => ({ ...item, icon: <item.icon /> }))}
        />
        <NavSecondary
          items={data.navSecondary.map((item) => ({
            ...item,
            icon: <item.icon />,
          }))}
          className="mt-auto"
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
