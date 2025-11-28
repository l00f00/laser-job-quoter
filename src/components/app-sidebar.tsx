import React from "react";
import { useLocation } from "react-router-dom";
import { Home, Layers, Compass, Star, Settings, LifeBuoy, List } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarSeparator,
  SidebarInput,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";

export function AppSidebar(): JSX.Element {
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (p: string) => currentPath === p;
  return (
    <Sidebar>
      <SidebarHeader>
        <a href="/" className="flex items-center gap-2 px-2 py-1">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-[rgb(245,128,37)] to-[rgb(230,90,27)]" />
          <span className="text-sm font-medium">LuxQuote</span>
        </a>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <a href="/"><Home /> <span>Home</span></a>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <a href="/quote"><Layers /> <span>New Quote</span></a>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <a href="/quotes"><List /> <span>My Quotes</span></a>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <a href="#"><LifeBuoy /> <span>Help Center</span></a>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <a href="#"><Settings /> <span>Settings</span></a>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 text-xs text-muted-foreground">Instant Laser Quotes</div>
      </SidebarFooter>
    </Sidebar>
  );
}