"use client";

import * as React from "react";
import {
  Folders,
  LayoutDashboard,
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
  SidebarMenuItem,
  SidebarMenuButton, 
} from "@/ui/sidebar";

import { NavMain } from "@/components/navbar/nav-main";
import { NavUser } from "@/components/navbar/nav-user";
import { NavSecondary } from "@/components/navbar/nav-secondary";

const data = {
  user: {
    name: "Usuário",
    email: "usuario@synthtask.com",
    avatar: "",
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
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/50"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#3B82F6] text-white">
                <Zap className="size-4 fill-white" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold">SynthTask</span>
                <span className="truncate text-xs text-muted-foreground">
                  Automação Inteligente
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
