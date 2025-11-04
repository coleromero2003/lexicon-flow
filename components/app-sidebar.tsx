"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useOrganization, UserButton, useUser } from "@clerk/nextjs";
import {
  Building2,
  FolderKanban,
  Workflow,
  Box,
  Network,
  FileText,
  LayoutDashboard,
  Library,
  ListTodo,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useProjects } from "@/lib/hooks/useProjects";
import { useState, useEffect } from "react";

export function AppSidebar() {
  const pathname = usePathname();
  const { organization } = useOrganization();
  const { user } = useUser();
  const { projects } = useProjects();

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Extract project ID from pathname
  useEffect(() => {
    const projectMatch = pathname.match(/\/projects\/(\d+)/);
    if (projectMatch) {
      setSelectedProjectId(parseInt(projectMatch[1]));
    } else {
      setSelectedProjectId(null);
    }
  }, [pathname]);

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2 px-2 py-2 hover:opacity-90 transition"
        >
          <Image
            src="/logo.svg"
            alt="Lexicon Flow"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold truncate" title="Lexicon Flow">Lexicon Flow</p>
            <p className="text-xs text-muted-foreground truncate" title={organization?.name || "No Organization"}>
              {organization?.name || "No Organization"}
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Dashboard access */}
        <SidebarGroup>
          <SidebarGroupLabel>Hub</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard"}
                  tooltip="Dashboard"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/tasks"}
                  tooltip="Tasks"
                >
                  <Link href="/tasks">
                    <ListTodo />
                    <span>Tasks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/lexicon" || pathname.startsWith("/lexicon/")}
                  tooltip="Lexicon Items"
                >
                  <Link href="/lexicon">
                    <Library />
                    <span>Lexicon</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/projects" || (pathname.startsWith("/projects/") && !selectedProjectId)}
                  tooltip="All Projects"
                >
                  <Link href="/projects">
                    <FolderKanban />
                    <span>Projects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {selectedProject && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="min-w-0" title={selectedProject.name}>
                {selectedProject.name}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === `/projects/${selectedProjectId}`}
                      tooltip="Project Overview"
                    >
                      <Link href={`/projects/${selectedProjectId}`}>
                        <FolderKanban />
                        <span>Overview</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(
                        `/projects/${selectedProjectId}/workflows`
                      )}
                      tooltip="Workflows"
                    >
                      <Link href={`/projects/${selectedProjectId}/workflows`}>
                        <Workflow />
                        <span>Workflows</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(
                        `/projects/${selectedProjectId}/objects`
                      )}
                      tooltip="Objects"
                    >
                      <Link href={`/projects/${selectedProjectId}/objects`}>
                        <Box />
                        <span>Objects</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(
                        `/projects/${selectedProjectId}/graph`
                      )}
                      tooltip="Graph View"
                    >
                      <Link href={`/projects/${selectedProjectId}/graph`}>
                        <Network />
                        <span>Graph View</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(
                        `/projects/${selectedProjectId}/files`
                      )}
                      tooltip="Files"
                    >
                      <Link href={`/projects/${selectedProjectId}/files`}>
                        <FileText />
                        <span>Files</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
          </>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Organization</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Organization Settings">
                  <Link href="/organization">
                    <Building2 />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-2">
              <UserButton />
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <p
                  className="text-sm font-medium truncate"
                  title={user?.firstName || user?.emailAddresses[0]?.emailAddress}
                >
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                </p>
                <p
                  className="text-xs text-muted-foreground truncate"
                  title={user?.emailAddresses[0]?.emailAddress}
                >
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
