import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Layers, List, Settings, LifeBuoy, Database, DollarSign, Key, BookOpen, Headphones, ShieldCheck } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { mockAuth } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";
export function AppSidebar(): JSX.Element {
  const location = useLocation();
  const currentPath = location.pathname;
  const [role, setRole] = useState(mockAuth.getRole());
  const [isDevMode, setIsDevMode] = useState(false);
  useEffect(() => {
    const handleStorageChange = () => {
      setRole(mockAuth.getRole());
    };
    window.addEventListener('storage', handleStorageChange);
    setIsDevMode(new URLSearchParams(window.location.search).get('dev') === '1');
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  const isActive = (path: string, exact = false) => {
    return exact ? currentPath === path : currentPath.startsWith(path);
  };
  const handleRoleSwitch = async () => {
    const currentRole = mockAuth.getRole();
    const nextEmail = currentRole === 'admin' ? 'demo@luxquote.com' : 'admin@luxquote.com';
    const nextPass = currentRole === 'admin' ? 'demo123' : 'admin123';
    await mockAuth.login(nextEmail, nextPass);
    window.location.reload();
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
              <Link to="/" className={cn("flex items-center", isActive('/', true) && 'bg-sidebar-accent text-sidebar-accent-foreground')}><Home className="mr-2 h-4 w-4" /> <span>Home</span></Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link to="/quote" className={cn("flex items-center", isActive('/quote') && 'bg-sidebar-accent text-sidebar-accent-foreground')}><Layers className="mr-2 h-4 w-4" /> <span>New Quote</span></Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              {role === 'admin' ? (
                <Link to="/admin/orders" className={cn("flex items-center", isActive('/admin/orders') && 'bg-sidebar-accent text-sidebar-accent-foreground')}><List className="mr-2 h-4 w-4" /> <span>All Requests</span></Link>
              ) : (
                <Link to="/quotes" className={cn("flex items-center", isActive('/quotes') && 'bg-sidebar-accent text-sidebar-accent-foreground')}><List className="mr-2 h-4 w-4" /> <span>My Quotes</span></Link>
              )}
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
                  <Link to="/admin" className={cn("flex items-center", isActive('/admin', true) && 'bg-sidebar-accent text-sidebar-accent-foreground')}><ShieldCheck className="mr-2 h-4 w-4" /><span>Dashboard</span></Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link to="/admin/materials" className={cn("flex items-center", isActive('/admin/materials') && 'bg-sidebar-accent text-sidebar-accent-foreground')}><Database className="mr-2 h-4 w-4" /><span>Materials</span></Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link to="/admin/pricing" className={cn("flex items-center", isActive('/admin/pricing') && 'bg-sidebar-accent text-sidebar-accent-foreground')}><DollarSign className="mr-2 h-4 w-4" /><span>Pricing</span></Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link to="/admin/stripe" className={cn("flex items-center", isActive('/admin/stripe') && 'bg-sidebar-accent text-sidebar-accent-foreground')}><Key className="mr-2 h-4 w-4" /><span>Stripe</span></Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link to="/admin/help-center" className={cn("flex items-center", isActive('/admin/help-center') && 'bg-sidebar-accent text-sidebar-accent-foreground')}><BookOpen className="mr-2 h-4 w-4" /><span>Help Center</span></Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link to="/admin/support" className={cn("flex items-center", isActive('/admin/support') && 'bg-sidebar-accent text-sidebar-accent-foreground')}><Headphones className="mr-2 h-4 w-4" /><span>Support</span></Link>
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
              <a href="#" className="flex items-center"><LifeBuoy className="mr-2 h-4 w-4" /> <span>Help Center</span></a>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <a href="#" className="flex items-center"><Settings className="mr-2 h-4 w-4" /> <span>Settings</span></a>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {isDevMode && (
          <Button variant="ghost" size="sm" onClick={handleRoleSwitch} className="w-full text-xs mb-2">
            {role === 'admin' ? 'Switch to User' : 'Switch to Admin'}
          </Button>
        )}
        <div className="px-2 text-xs text-muted-foreground">Instant Laser Quotes</div>
      </SidebarFooter>
    </Sidebar>
  );
}