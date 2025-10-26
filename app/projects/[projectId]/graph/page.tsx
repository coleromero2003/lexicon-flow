"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";
import Graph from "graphology";
import type Sigma from "sigma";
import {
  ArrowLeft,
  Loader2,
  RefreshCcw,
} from "lucide-react";

import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PdfViewerDialog } from "@/components/file-viewer/pdf-viewer-dialog";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { useSupabaseFileViewer } from "@/lib/hooks/useSupabaseFileViewer";
import {
  fileService,
  lexiconFileService,
  lexiconService,
  objectFileService,
  objectLexiconService,
  objectRelationService,
  objectService,
  projectService,
} from "@/lib/services";
import type {
  FileMeta,
  LexiconFileLink,
  LexiconItem,
  ObjectFileLink,
  ObjectLexiconLink,
  ObjectRelation,
  ScadaObject,
} from "@/lib/supabase/models";

const NODE_COLORS = {
  object: "#2563eb",
  file: "#16a34a",
  lexicon: "#a855f7",
} as const;

const EDGE_COLORS = {
  relation: "#3b82f6",
  file: "#22c55e",
  lexicon: "#c084fc",
  lexiconFile: "#f97316",
} as const;

type GraphData = {
  objects: ScadaObject[];
  relations: ObjectRelation[];
  objectFileLinks: ObjectFileLink[];
  objectLexiconLinks: ObjectLexiconLink[];
  files: FileMeta[];
  lexiconItems: LexiconItem[];
  lexiconFileLinks: LexiconFileLink[];
};

const NODE_LEGEND = [
  { label: "Objects", color: NODE_COLORS.object },
  { label: "Files", color: NODE_COLORS.file },
  { label: "Lexicon items", color: NODE_COLORS.lexicon },
] as const;

const EDGE_LEGEND = [
  { label: "Object relation", color: EDGE_COLORS.relation },
  { label: "Object ↔ File", color: EDGE_COLORS.file },
  { label: "Object ↔ Lexicon", color: EDGE_COLORS.lexicon },
  { label: "Lexicon ↔ File", color: EDGE_COLORS.lexiconFile },
] as const;

function getPolarPosition(index: number, total: number, radius: number) {
  if (total <= 1) {
    return { x: radius, y: 0 };
  }

  const angle = (index / total) * 2 * Math.PI;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function buildGraph(data: GraphData) {
  const graph = new Graph();

  const objectCount = data.objects.length;
  data.objects.forEach((object, index) => {
    const { x, y } = getPolarPosition(index, Math.max(objectCount, 1), 6);
    graph.addNode(`object-${object.id}`, {
      label: object.title,
      x,
      y,
      size: 12,
      color: NODE_COLORS.object,
      type: "circle",
    });
  });

  const fileCount = data.files.length;
  data.files.forEach((file, index) => {
    const { x, y } = getPolarPosition(index, Math.max(fileCount, 1), 10);
    graph.addNode(`file-${file.id}`, {
      label: file.filename,
      x,
      y,
      size: 8,
      color: NODE_COLORS.file,
      type: "circle",
    });
  });

  const lexiconCount = data.lexiconItems.length;
  data.lexiconItems.forEach((item, index) => {
    const { x, y } = getPolarPosition(index, Math.max(lexiconCount, 1), 14);
    graph.addNode(`lexicon-${item.id}`, {
      label: item.name,
      x,
      y,
      size: 9,
      color: NODE_COLORS.lexicon,
      type: "circle",
    });
  });

  data.relations.forEach((relation) => {
    const sourceKey = `object-${relation.src_object_id}`;
    const targetKey = `object-${relation.dst_object_id}`;
    if (graph.hasNode(sourceKey) && graph.hasNode(targetKey)) {
      const edgeKey = `relation-${relation.id}`;
      if (!graph.hasEdge(edgeKey)) {
        graph.addDirectedEdgeWithKey(edgeKey, sourceKey, targetKey, {
          size: 1.5,
          color: EDGE_COLORS.relation,
          type: "arrow",
          label: relation.relation_kind.replace(/_/g, " "),
        });
      }
    }
  });

  data.objectFileLinks.forEach((link) => {
    const sourceKey = `object-${link.object_id}`;
    const targetKey = `file-${link.file_id}`;
    if (graph.hasNode(sourceKey) && graph.hasNode(targetKey)) {
      const edgeKey = `object-file-${link.object_id}-${link.file_id}`;
      if (!graph.hasEdge(edgeKey)) {
        graph.addUndirectedEdgeWithKey(edgeKey, sourceKey, targetKey, {
          size: 1.2,
          color: EDGE_COLORS.file,
        });
      }
    }
  });

  data.objectLexiconLinks.forEach((link) => {
    const sourceKey = `object-${link.object_id}`;
    const targetKey = `lexicon-${link.lexicon_id}`;
    if (graph.hasNode(sourceKey) && graph.hasNode(targetKey)) {
      const edgeKey = `object-lexicon-${link.object_id}-${link.lexicon_id}`;
      if (!graph.hasEdge(edgeKey)) {
        graph.addUndirectedEdgeWithKey(edgeKey, sourceKey, targetKey, {
          size: 1.2,
          color: EDGE_COLORS.lexicon,
        });
      }
    }
  });

  data.lexiconFileLinks.forEach((link) => {
    const sourceKey = `lexicon-${link.lexicon_id}`;
    const targetKey = `file-${link.file_id}`;
    if (graph.hasNode(sourceKey) && graph.hasNode(targetKey)) {
      const edgeKey = `lexicon-file-${link.lexicon_id}-${link.file_id}`;
      if (!graph.hasEdge(edgeKey)) {
        graph.addUndirectedEdgeWithKey(edgeKey, sourceKey, targetKey, {
          size: 1,
          color: EDGE_COLORS.lexiconFile,
        });
      }
    }
  });

  return graph;
}

export default function ProjectGraphPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const projectIdNum = Number(projectId);
  const router = useRouter();
  const { organization } = useOrganization();
  const { supabase } = useSupabase();

  const [projectName, setProjectName] = useState<string>("");
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<{
    type: "object" | "file" | "lexicon";
    id: number;
    label: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sigmaInstanceRef = useRef<Sigma | null>(null);

  const {
    openFile,
    setViewerOpen,
    state: { isViewerOpen, viewerFile, viewerUrl, viewerLoading },
  } = useSupabaseFileViewer({
    supabase,
    bucket: "lexicon-files",
    onError: (error) => {
      console.error("Failed to open file", error);
    },
  });

  const fetchGraphData = useCallback(
    async (cancelRef?: { current: boolean }) => {
      if (!supabase || Number.isNaN(projectIdNum)) {
        return;
      }

      if (cancelRef?.current) return;

      setLoading(true);
      setError(null);

      try {
        const project = await projectService.getProjectById(
          supabase,
          projectIdNum
        );
        if (cancelRef?.current) return;
        setProjectName(project.name);

        const objects = await objectService.getObjectsByProject(
          supabase,
          projectIdNum
        );
        if (cancelRef?.current) return;

        if (objects.length === 0) {
          setGraphData({
            objects: [],
            relations: [],
            objectFileLinks: [],
            objectLexiconLinks: [],
            files: [],
            lexiconItems: [],
            lexiconFileLinks: [],
          });
          return;
        }

        const objectIds = objects.map((obj) => obj.id);

        const [relations, objectFileLinks, objectLexiconLinks] =
          await Promise.all([
            objectRelationService.getRelationsForObjects(
              supabase,
              objectIds
            ),
            objectFileService.getLinksForObjects(supabase, objectIds),
            objectLexiconService.getLinksForObjects(supabase, objectIds),
          ]);
        if (cancelRef?.current) return;

        const lexiconIds = Array.from(
          new Set(objectLexiconLinks.map((link) => link.lexicon_id))
        );

        const [lexiconItems, lexiconFileLinks] =
          lexiconIds.length > 0
            ? await Promise.all([
                lexiconService.getLexiconItemsByIds(supabase, lexiconIds),
                lexiconFileService.getLinksForLexiconIds(
                  supabase,
                  lexiconIds
                ),
              ])
            : [[], []];
        if (cancelRef?.current) return;

        const fileIds = new Set<number>();
        objectFileLinks.forEach((link) => fileIds.add(link.file_id));
        lexiconFileLinks.forEach((link) => fileIds.add(link.file_id));

        const files =
          fileIds.size > 0
            ? await fileService.getFilesByIds(
                supabase,
                Array.from(fileIds)
              )
            : [];
        if (cancelRef?.current) return;

        setGraphData({
          objects,
          relations,
          objectFileLinks,
          objectLexiconLinks,
          files,
          lexiconItems,
          lexiconFileLinks,
        });
      } catch (err) {
        if (cancelRef?.current) return;
        console.error("Failed to load project graph", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load project graph"
        );
        setGraphData(null);
      } finally {
        if (!cancelRef?.current) {
          setLoading(false);
        }
      }
    },
    [supabase, projectIdNum]
  );

  useEffect(() => {
    const cancelRef = { current: false };
    fetchGraphData(cancelRef);
    return () => {
      cancelRef.current = true;
    };
  }, [fetchGraphData]);

  const hasGraphNodes = useMemo(() => {
    if (!graphData) return false;
    return (
      graphData.objects.length > 0 ||
      graphData.files.length > 0 ||
      graphData.lexiconItems.length > 0
    );
  }, [graphData]);

  useEffect(() => {
    if (!graphData || !containerRef.current || !hasGraphNodes) {
      if (sigmaInstanceRef.current) {
        sigmaInstanceRef.current.kill();
        sigmaInstanceRef.current = null;
      }
      return;
    }

    let renderer: InstanceType<typeof Sigma> | null = null;

    // Dynamically import Sigma only on the client side
    const initSigma = async () => {
      const { default: SigmaConstructor } = await import("sigma");

      if (!containerRef.current) return;

      const graph = buildGraph(graphData);
      renderer = new SigmaConstructor(graph, containerRef.current, {
        renderLabels: true,
        labelDensity: 1,
      });
      sigmaInstanceRef.current = renderer;

      const handleNodeClick = async (event: { node: string }) => {
        const nodeKey = event.node;
        const [nodeType, nodeId] = nodeKey.split("-");
        const id = Number(nodeId);

        if (!Number.isNaN(id)) {
          const nodeData = graph.getNodeAttributes(nodeKey);

          // If it's a file, open the file viewer
          if (nodeType === "file" && graphData) {
            const fileData = graphData.files.find((f) => f.id === id);
            if (fileData) {
              await openFile(fileData);
              return;
            }
          }

          // For non-file nodes, show the navigation dialog
          setSelectedNode({
            type: nodeType as "object" | "file" | "lexicon",
            id,
            label: nodeData.label || nodeKey,
          });
          setDialogOpen(true);
        }
      };

      renderer.on("clickNode", handleNodeClick);

      const handleResize = () => {
        renderer?.refresh();
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (renderer) {
          renderer.off("clickNode", handleNodeClick);
          renderer.kill();
        }
      };
    };

    let cleanup: (() => void) | undefined;

    initSigma().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      cleanup?.();
      sigmaInstanceRef.current = null;
    };
  }, [graphData, hasGraphNodes, openFile]);

  useEffect(() => {
    return () => {
      if (sigmaInstanceRef.current) {
        sigmaInstanceRef.current.kill();
        sigmaInstanceRef.current = null;
      }
    };
  }, []);

  const nodeCount = useMemo(
    () =>
      graphData
        ? graphData.objects.length +
          graphData.files.length +
          graphData.lexiconItems.length
        : 0,
    [graphData]
  );

  const edgeCount = useMemo(
    () =>
      graphData
        ? graphData.relations.length +
          graphData.objectFileLinks.length +
          graphData.objectLexiconLinks.length +
          graphData.lexiconFileLinks.length
        : 0,
    [graphData]
  );

  const handleNavigateToNode = () => {
    if (!selectedNode) return;

    let url = "";
    switch (selectedNode.type) {
      case "object":
        // Navigate to object detail page (you may need to adjust this URL)
        url = `/projects/${projectId}/objects/${selectedNode.id}`;
        break;
      case "file":
        // Navigate to file detail page (you may need to adjust this URL)
        url = `/projects/${projectId}/files/${selectedNode.id}`;
        break;
      case "lexicon":
        // Navigate to lexicon item detail page (you may need to adjust this URL)
        url = `/lexicon/${selectedNode.id}`;
        break;
    }

    if (url) {
      router.push(url);
    }
    setDialogOpen(false);
  };

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <EmptyState
            title="No organization selected"
            description="Please select an organization to view project data."
          />
        </main>
      </div>
    );
  }

  if (Number.isNaN(projectIdNum)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <EmptyState
            title="Invalid project"
            description="The requested project could not be determined."
            action={
              <Button onClick={() => router.push("/projects")}>Go back</Button>
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="pl-0"
            onClick={() => router.push(`/projects/${projectId}/workflows`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to workflows
          </Button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                System graph {projectName ? `for ${projectName}` : ""}
              </h1>
              <p className="text-gray-600 mt-1">
                Visualize how objects, files, and lexicon items connect within
                your project.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchGraphData()}
                disabled={loading}
              >
                <RefreshCcw
                  className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push("/projects")}
              >
                Projects overview
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Objects</CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">
                {graphData?.objects.length ?? 0}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Files</CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">
                {graphData?.files.length ?? 0}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">
                Lexicon items
              </CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">
                {graphData?.lexiconItems.length ?? 0}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Connections</CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">
                {edgeCount}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Graph legend</CardTitle>
            <CardDescription>
              Colors indicate the node or relationship type inside the graph
              visualization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Nodes</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {NODE_LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Relationships
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {EDGE_LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span
                      className="h-3 w-6 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relationship graph</CardTitle>
            <CardDescription>
              {nodeCount > 0
                ? `Rendering ${nodeCount} nodes and ${edgeCount} connections.`
                : "A graph will appear once this project has related data."}
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[420px]">
            {error ? (
              <EmptyState
                title="Unable to load graph"
                description={error}
                action={
                  <Button onClick={() => fetchGraphData()}>
                    Retry loading graph
                  </Button>
                }
              />
            ) : loading ? (
              <div className="flex h-[360px] flex-col items-center justify-center text-gray-500">
                <Loader2 className="mb-3 h-6 w-6 animate-spin" />
                <p>Loading graph data...</p>
              </div>
            ) : hasGraphNodes ? (
              <div ref={containerRef} className="h-[520px] w-full" />
            ) : (
              <EmptyState
                title="No relationships yet"
                description="Create object relations or attach files and lexicon items to visualize your system graph."
              />
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Navigate to {selectedNode?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to go to the detail page for this{" "}
              {selectedNode?.type === "object"
                ? "object"
                : selectedNode?.type === "file"
                  ? "file"
                  : "lexicon item"}
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleNavigateToNode}>
              Go to page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PdfViewerDialog
        open={isViewerOpen}
        onOpenChange={setViewerOpen}
        file={viewerFile}
        url={viewerUrl}
        loading={viewerLoading}
      />
    </div>
  );
}
