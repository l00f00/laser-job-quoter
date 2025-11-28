import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Layers, List, Settings, LifeBuoy, Database, DollarSign, Key, BookOpen, Headphones } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarSeparator,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { mockAuth } from "@/lib/auth-utils";
export function AppSidebar(): JSX.Element {
  const location = useLocation();
  const currentPath = location.pathname;
  const [role, setRole] = useState(mockAuth.getRole());
  useEffect(() => {
    const handleStorageChange = () => {
      setRole(mockAuth.getRole());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-1">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-[rgb(245,128,37)] to-[rgb(230,90,27)]" />
          <span className="text-sm font-medium">LuxQuote</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem active={currentPath === '/'}>
              <Link to="/"><Home /> <span>Home</span></Link>
            </SidebarMenuItem>
            <SidebarMenuItem active={currentPath.startsWith('/quote')}>
              <Link to="/quote"><Layers /> <span>New Quote</span></Link>
            </SidebarMenuItem>
            <SidebarMenuItem active={currentPath === '/quotes'}>
              <Link to="/quotes"><List /> <span>My Quotes</span></Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />
        {role === 'admin' && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Admin Tools</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem active={currentPath === '/admin/materials'}>
                  <Link to="/admin/materials"><Database /><span>Materials</span></Link>
                </SidebarMenuItem>
                <SidebarMenuItem active={currentPath === '/admin/pricing'}>
                  <Link to="/admin/pricing"><DollarSign /><span>Pricing</span></Link>
                </SidebarMenuItem>
                <SidebarMenuItem active={currentPath === '/admin/stripe'}>
                  <Link to="/admin/stripe"><Key /><span>Stripe</span></Link>
                </SidebarMenuItem>
                <SidebarMenuItem active={currentPath === '/admin/help-center'}>
                  <Link to="/admin/help-center"><BookOpen /><span>Help Center</span></Link>
                </SidebarMenuItem>
                <SidebarMenuItem active={currentPath === '/admin/support'}>
                  <Link to="/admin/support"><Headphones /><span>Support</span></Link>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarSeparator />
          </>
        )}
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