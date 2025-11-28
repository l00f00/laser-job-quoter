import React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { cn } from "@/lib/utils";
type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
};
export function AppLayout({ children, container = false, className, contentClassName }: AppLayoutProps): JSX.Element {
  return (
    <SidebarProvider defaultOpen={false}>
      {/* The sidebar is part of the template but not used in Phase 1's primary flow. It remains for future use. */}
      {/* <AppSidebar /> */}
      <SidebarInset className={className}>
        {/* The trigger is also hidden for now as the sidebar is not a primary feature of the quote builder. */}
        {/* <div className="absolute left-2 top-2 z-20">
          <SidebarTrigger />
        </div> */}
        {container ? (
          <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12", contentClassName)}>
            {children}
          </div>
        ) : (
          children
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}