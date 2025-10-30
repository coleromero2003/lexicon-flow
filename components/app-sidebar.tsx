"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOrganization, UserButton, useUser } from "@clerk/nextjs";
import {
  Building2,
  FolderKanban,
  Plus,
  Workflow,
  Box,
  Network,
  FileText,
  BookOpen,
  ClipboardList,
  CheckSquare,
  AlertCircle,
  FileStack,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useProjects } from "@/lib/hooks/useProjects";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { useState, useEffect, useCallback } from "react";
import type { ScadaObject, ObjectSubtask, LexiconItem } from "@/lib/supabase/models";

type ObjectWithProject = ScadaObject & {
  projects: {
    id: number;
    name: string;
    org_id: string;
  };
};

export function AppSidebar() {
  const pathname = usePathname();
  const { organization } = useOrganization();
  const { user } = useUser();
  const { projects, loading: projectsLoading } = useProjects();
  const { supabase } = useSupabase();

  const [assignedObjects, setAssignedObjects] = useState<ObjectWithProject[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<ObjectSubtask[]>([]);
  const [lexiconCounts, setLexiconCounts] = useState({
    parts: 0,
    workflow_templates: 0,
    step_templates: 0,
    documents: 0,
    specs: 0,
    clients: 0,
  });
  const [objectPriorityCounts, setObjectPriorityCounts] = useState({
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0,
  });
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Load user assignments
  const loadUserAssignments = useCallback(async () => {
    if (!supabase || !organization?.id || !user?.id) {
      setLoadingUserData(false);
      return;
    }

    try {
      setLoadingUserData(true);

      // Fetch all objects for the organization through projects
      const { data: allObjects, error: objectsError } = await supabase
        .from("objects")
        .select(`
          *,
          projects!inner(id, name, org_id)
        `)
        .eq("projects.org_id", organization.id);

      if (objectsError) throw objectsError;

      // Filter objects where user is in assignee array
      const userObjects = (allObjects || []).filter((obj: ObjectWithProject) =>
        obj.assignee && obj.assignee.includes(user.id)
      );

      setAssignedObjects(userObjects);

      // Fetch all subtasks for user's objects
      if (userObjects.length > 0) {
        const objectIds = userObjects.map((obj: ObjectWithProject) => obj.id);
        const { data: tasks, error: tasksError } = await supabase
          .from("object_subtasks")
          .select("*")
          .in("object_id", objectIds)
          .eq("is_done", false)
          .order("sort_order", { ascending: true });

        if (tasksError) {
          console.error("Subtasks query error:", tasksError);
          setAssignedTasks([]);
        } else {
          setAssignedTasks(tasks || []);
        }
      } else {
        setAssignedTasks([]);
      }

      // Fetch object priority counts
      const { data: allOrgObjects } = await supabase
        .from("objects")
        .select(`
          priority,
          projects!inner(org_id)
        `)
        .eq("projects.org_id", organization.id);

      if (allOrgObjects) {
        const counts = {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0,
        };
        (allOrgObjects as Pick<ScadaObject, "priority">[]).forEach((obj) => {
          if (obj.priority) {
            counts[obj.priority as keyof typeof counts]++;
          }
        });
        setObjectPriorityCounts(counts);
      }
    } catch (err) {
      console.error("Failed to load user assignments", err);
      setAssignedObjects([]);
      setAssignedTasks([]);
    } finally {
      setLoadingUserData(false);
    }
  }, [supabase, organization, user]);

  // Load lexicon counts
  const loadLexiconCounts = useCallback(async () => {
    if (!supabase || !organization?.id) return;

    try {
      const { data: lexiconItems } = await supabase
        .from("lexicon_items")
        .select("item_type")
        .eq("org_id", organization.id);

      if (lexiconItems) {
        type LexiconItemTypeRow = Pick<LexiconItem, "item_type">;
        const counts = {
          parts: 0,
          workflow_templates: 0,
          step_templates: 0,
          documents: 0,
          specs: 0,
          clients: 0,
        };
        (lexiconItems as LexiconItemTypeRow[]).forEach(({ item_type }) => {
          if (item_type === "part") counts.parts++;
          else if (item_type === "workflow_template") counts.workflow_templates++;
          else if (item_type === "step_template") counts.step_templates++;
          else if (item_type === "document") counts.documents++;
          else if (item_type === "spec") counts.specs++;
          else if (item_type === "client") counts.clients++;
        });
        setLexiconCounts(counts);
      }
    } catch (err) {
      console.error("Failed to load lexicon counts", err);
    }
  }, [supabase, organization]);

  useEffect(() => {
    loadUserAssignments();
    loadLexiconCounts();
  }, [loadUserAssignments, loadLexiconCounts]);

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
        <div className="flex items-center gap-2 px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-600 text-white text-xs">
              LF
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold truncate">Lexicon Flow</p>
            <p className="text-xs text-muted-foreground truncate">
              {organization?.name || "No Organization"}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Organization Context & Settings */}
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

        <SidebarSeparator />

        {/* Project Overview & Creation */}
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupAction asChild>
            <Link href="/dashboard?action=create">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Create Project</span>
            </Link>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard"}
                  tooltip="All Projects"
                >
                  <Link href="/dashboard">
                    <FolderKanban />
                    <span>All Projects</span>
                    {!projectsLoading && (
                      <SidebarMenuBadge>{projects.length}</SidebarMenuBadge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* My Work Queue */}
        {!loadingUserData && (assignedObjects.length > 0 || assignedTasks.length > 0) && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>My Work</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {assignedObjects.length > 0 && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        tooltip={`${assignedObjects.length} Assigned Objects`}
                      >
                        <Link href="/dashboard#my-objects">
                          <ClipboardList />
                          <span>My Objects</span>
                          <SidebarMenuBadge>{assignedObjects.length}</SidebarMenuBadge>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {assignedTasks.length > 0 && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        tooltip={`${assignedTasks.length} Tasks`}
                      >
                        <Link href="/dashboard#my-tasks">
                          <CheckSquare />
                          <span>My Tasks</span>
                          <SidebarMenuBadge>{assignedTasks.length}</SidebarMenuBadge>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
          </>
        )}

        {/* Project Navigation Shortcuts - Only show when a project is selected */}
        {selectedProject && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>
                {selectedProject.name.length > 20
                  ? `${selectedProject.name.substring(0, 20)}...`
                  : selectedProject.name}
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

        {/* Object Management Tools */}
        <SidebarGroup>
          <SidebarGroupLabel>Object Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="All Objects">
                  <Link href="/objects">
                    <Box />
                    <span>All Objects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {objectPriorityCounts.urgent > 0 && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Urgent Objects">
                    <Link href="/objects?priority=urgent">
                      <AlertCircle className="text-red-600" />
                      <span>Urgent</span>
                      <SidebarMenuBadge className="bg-red-100 text-red-600">
                        {objectPriorityCounts.urgent}
                      </SidebarMenuBadge>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Lexicon & Reusable Assets */}
        <SidebarGroup>
          <SidebarGroupLabel>Lexicon Library</SidebarGroupLabel>
          <SidebarGroupAction asChild>
            <Link href="/lexicon?action=create">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add Lexicon Item</span>
            </Link>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/lexicon"}
                  tooltip="All Lexicon Items"
                >
                  <Link href="/lexicon">
                    <BookOpen />
                    <span>All Items</span>
                    <SidebarMenuBadge>
                      {Object.values(lexiconCounts).reduce((a, b) => a + b, 0)}
                    </SidebarMenuBadge>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {lexiconCounts.parts > 0 && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Parts">
                    <Link href="/lexicon?type=part">
                      <Box className="h-4 w-4" />
                      <span>Parts</span>
                      <SidebarMenuBadge>{lexiconCounts.parts}</SidebarMenuBadge>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {lexiconCounts.documents > 0 && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Documents">
                    <Link href="/lexicon?type=document">
                      <FileText className="h-4 w-4" />
                      <span>Documents</span>
                      <SidebarMenuBadge>{lexiconCounts.documents}</SidebarMenuBadge>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Files & Reporting */}
        <SidebarGroup>
          <SidebarGroupLabel>Files & Reports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/files"}
                  tooltip="All Files"
                >
                  <Link href="/files">
                    <FileStack />
                    <span>All Files</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Generate Report">
                  <Link href="/reports">
                    <FileText />
                    <span>Generate Report</span>
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
                <p className="text-sm font-medium truncate">
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                </p>
                <p className="text-xs text-muted-foreground truncate">
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
