"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { projectService, workflowService, objectService, lexiconService } from "@/lib/services";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type BreadcrumbSegment = {
  label: string;
  href?: string;
  isLoading?: boolean;
};

/**
 * Dynamic breadcrumb component that automatically generates breadcrumbs
 * based on the current route pathname and fetches entity names as needed.
 */
export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const { supabase } = useSupabase();
  const [entityNames, setEntityNames] = useState<Record<string, string>>({});

  // Parse pathname into segments
  const pathSegments = useMemo(() => {
    return pathname.split("/").filter(Boolean);
  }, [pathname]);

  // Extract IDs from path
  const extractedIds = useMemo(() => {
    const ids: Record<string, string> = {};

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      const prevSegment = i > 0 ? pathSegments[i - 1] : null;

      // Check if segment is numeric (likely an ID)
      if (/^\d+$/.test(segment)) {
        if (prevSegment === "projects") {
          ids.projectId = segment;
        } else if (prevSegment === "workflows") {
          ids.workflowId = segment;
        } else if (prevSegment === "objects") {
          ids.objectId = segment;
        } else if (prevSegment === "lexicon") {
          ids.lexiconId = segment;
        }
      }
    }

    return ids;
  }, [pathSegments]);

  // Fetch entity names for IDs in the path
  useEffect(() => {
    async function loadEntityNames() {
      if (!supabase) return;

      const names: Record<string, string> = {};

      try {
        if (extractedIds.projectId) {
          const project = await projectService.getProjectById(
            supabase,
            Number(extractedIds.projectId)
          );
          names[`project-${extractedIds.projectId}`] = project.name;
        }

        if (extractedIds.workflowId) {
          const workflow = await workflowService.getWorkflow(
            supabase,
            Number(extractedIds.workflowId)
          );
          names[`workflow-${extractedIds.workflowId}`] = workflow.name;
        }

        if (extractedIds.objectId) {
          const object = await objectService.getObject(
            supabase,
            Number(extractedIds.objectId)
          );
          names[`object-${extractedIds.objectId}`] = object.title;
        }

        if (extractedIds.lexiconId) {
          const lexicon = await lexiconService.getLexiconItem(
            supabase,
            Number(extractedIds.lexiconId)
          );
          names[`lexicon-${extractedIds.lexiconId}`] = lexicon.name;
        }

        setEntityNames(names);
      } catch (error) {
        console.error("Failed to load entity names for breadcrumbs:", error);
      }
    }

    loadEntityNames();
  }, [supabase, extractedIds]);

  // Build breadcrumb segments
  const breadcrumbs = useMemo(() => {
    const segments: BreadcrumbSegment[] = [
      { label: "Home", href: "/" },
    ];

    let currentPath = "";

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      currentPath += `/${segment}`;
      const prevSegment = i > 0 ? pathSegments[i - 1] : null;

      // Skip numeric IDs - they'll be replaced by entity names
      if (/^\d+$/.test(segment)) {
        let entityKey = "";
        let entityLabel = segment;

        if (prevSegment === "projects") {
          entityKey = `project-${segment}`;
          entityLabel = entityNames[entityKey] || "Loading...";
        } else if (prevSegment === "workflows") {
          entityKey = `workflow-${segment}`;
          entityLabel = entityNames[entityKey] || "Workflow";
        } else if (prevSegment === "objects") {
          entityKey = `object-${segment}`;
          entityLabel = entityNames[entityKey] || "Object";
        } else if (prevSegment === "lexicon") {
          entityKey = `lexicon-${segment}`;
          entityLabel = entityNames[entityKey] || "Lexicon Item";
        }

        segments.push({
          label: entityLabel,
          href: currentPath,
          isLoading: !!entityKey && !entityNames[entityKey],
        });
      } else {
        // Format segment label (capitalize, handle special cases)
        let label = segment.charAt(0).toUpperCase() + segment.slice(1);

        // Special case formatting
        if (segment === "dashboard") label = "Dashboard";
        else if (segment === "lexicon") label = "Lexicon";
        else if (segment === "organization") label = "Organization";
        else if (segment === "workflows") label = "Workflows";
        else if (segment === "objects") label = "Objects";
        else if (segment === "files") label = "Files";
        else if (segment === "graph") label = "Graph";

        segments.push({
          label,
          href: currentPath,
        });
      }
    }

    return segments;
  }, [pathSegments, entityNames]);

  // Don't render breadcrumbs on home page
  if (pathname === "/" || breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <div key={crumb.href || crumb.label} className="contents">
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href!}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
