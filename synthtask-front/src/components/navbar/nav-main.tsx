"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: React.ElementType; 
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.url;

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive}
                className={`
                  transition-colors duration-200
                  ${
                    isActive
                      ? "!bg-[#3B82F6]/10 !text-[#3B82F6] hover:!bg-[#3B82F6]/15" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted" 
                  }
                `}
              >
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span className={isActive ? "font-medium" : ""}>
                    {item.title}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
