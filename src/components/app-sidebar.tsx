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
import { cn } from "@/lib/utils";
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
  const isActive = (path: string, exact = false) => {
    return exact ? currentPath === path : currentPath.startsWith(path);
  };
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
            <SidebarMenuItem>
              <Link to="/" className={cn(isActive('/', true) && 'bg-sidebar-accent text-sidebar-accent-foreground')}><Home /> <span>Home</span></Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link to="/quote" className={cn(isActive('/quote') && 'bg-sidebar-accent text-sidebar-accent-foreground')}><Layers /> <span>New Quote</span></Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link to="/quotes" className={cn(isActive('/quotes') && 'bg-sidebar-accent text-sidebar-accent-foreground')}><List /> <span>My Quotes</span></Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />
        {role === 'admin' && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Admin Tools</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link to="/admin/materials" className={cn(isActive('/admin/materials') && 'bg-sidebar-accent text-sidebar-accent-foreground')}><Database /><span>Materials</span></Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link to="/admin/pricing" className={cn(isActive('/admin/pricing') && 'bg-sidebar-accent text-sidebar-accent-foreground')}><DollarSign /><span>Pricing</span></Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link to="/admin/stripe" className={cn(isActive('/admin/stripe') && 'bg-sidebar-accent text-sidebar-accent-foreground')}><Key /><span>Stripe</span></Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link to="/admin/help-center" className={cn(isActive('/admin/help-center') && 'bg-sidebar-accent text-sidebar-accent-foreground')}><BookOpen /><span>Help Center</span></Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link to="/admin/support" className={cn(isActive('/admin/support') && 'bg-sidebar-accent text-sidebar-accent-foreground')}><Headphones /><span>Support</span></Link>
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