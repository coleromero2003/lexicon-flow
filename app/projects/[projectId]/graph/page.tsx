"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";
import Link from "next/link";
import { RefreshCcw } from "lucide-react";

import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageErrorBoundary } from "@/components/ui/page-error-boundary";
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

const OBJECT_CIRCLE_RADIUS = 6; // Inner circle for SCADA objects
const FILE_CIRCLE_RADIUS = 10; // Middle circle for project files
const LEXICON_CIRCLE_RADIUS = 14; // Outer circle for lexicon items

type GraphAttributes = Record<string, unknown>;

type GraphInstance = {
  addNode: (key: string, attributes?: GraphAttributes) => void;
  addDirectedEdgeWithKey: (
    key: string,
    source: string,
    target: string,
    attributes?: GraphAttributes
  ) => void;
  addUndirectedEdgeWithKey: (
    key: string,
    source: string,
    target: string,
    attributes?: GraphAttributes
  ) => void;
  hasNode: (key: string) => boolean;
  hasEdge: (key: string) => boolean;
  getNodeAttributes: (key: string) => GraphAttributes;
};

type GraphConstructor = new () => GraphInstance;

type SigmaNodeEvent = { node: string };

type SigmaInstance = {
  on: (event: string, handler: (payload: SigmaNodeEvent) => void) => void;
  off: (event: string, handler: (payload: SigmaNodeEvent) => void) => void;
  refresh: () => void;
  kill: () => void;
};

type SigmaConstructor = new (
  graph: GraphInstance,
  container: HTMLElement,
  settings?: Record<string, unknown>
) => SigmaInstance;

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

function buildGraph(GraphLibrary: GraphConstructor, data: GraphData): GraphInstance {
  const graph = new GraphLibrary();

  const objectCount = data.objects.length;
  data.objects.forEach((object, index) => {
    const { x, y } = getPolarPosition(
      index,
      Math.max(objectCount, 1),
      OBJECT_CIRCLE_RADIUS
    );
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
    const { x, y } = getPolarPosition(
      index,
      Math.max(fileCount, 1),
      FILE_CIRCLE_RADIUS
    );
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
    const { x, y } = getPolarPosition(
      index,
      Math.max(lexiconCount, 1),
      LEXICON_CIRCLE_RADIUS
    );
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

function GraphErrorFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <EmptyState
          title="Something went wrong"
          description="We couldn&apos;t render the project graph. Please refresh and try again."
          action={
            <Button onClick={() => window.location.reload()}>
              Reload page
            </Button>
          }
        />
      </main>
    </div>
  );
}

function ProjectGraphPageContent() {
  const { projectId } = useParams<{ projectId: string }>();
  const projectIdNum = Number(projectId);
  const router = useRouter();
  const { organization, isLoaded: organizationLoaded } = useOrganization();
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
  const sigmaInstanceRef = useRef<SigmaInstance | null>(null);

  const {
    openFile,
    setViewerOpen,
    state: { isViewerOpen, viewerFile, viewerUrl, viewerLoading },
  } = useSupabaseFileViewer({
    supabase,
    bucket: "lexicon-files",
    onError: (viewerError) => {
      console.error("Failed to open file", viewerError);
    },
  });

  const fetchGraphData = useCallback(
    async (cancelRef?: { current: boolean }) => {
      if (!supabase || Number.isNaN(projectIdNum) || !organizationLoaded) {
        return;
      }

      if (!organization) {
        setGraphData(null);
        setLoading(false);
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
        } else {
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

          let lexiconItems: LexiconItem[] = [];
          let lexiconFileLinks: LexiconFileLink[] = [];

          if (lexiconIds.length > 0) {
            const lexiconResults = await Promise.all([
              lexiconService.getLexiconItemsByIds(supabase, lexiconIds),
              lexiconFileService.getLinksForLexiconIds(supabase, lexiconIds),
            ]);
            if (cancelRef?.current) return;
            [lexiconItems, lexiconFileLinks] = lexiconResults;
          }

          const fileIds = new Set<number>();
          objectFileLinks.forEach((link) => fileIds.add(link.file_id));
          lexiconFileLinks.forEach((link) => fileIds.add(link.file_id));

          let files: FileMeta[] = [];
          if (fileIds.size > 0) {
            files = await fileService.getFilesByIds(
              supabase,
              Array.from(fileIds)
            );
            if (cancelRef?.current) return;
          }

          setGraphData({
            objects,
            relations,
            objectFileLinks,
            objectLexiconLinks,
            files,
            lexiconItems,
            lexiconFileLinks,
          });
        }
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
    [
      supabase,
      projectIdNum,
      organization,
      organizationLoaded,
    ]
  );

  useEffect(() => {
    const cancelRef = { current: false };
    void fetchGraphData(cancelRef);
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

    let active = true;
    let cleanup: (() => void) | undefined;

    const initSigma = async () => {
      try {
        const [{ default: GraphLibrary }, { default: SigmaLibrary }] =
          await Promise.all([
            import("graphology"),
            import("sigma"),
          ]);

        if (!containerRef.current || !active) {
          return;
        }

        const graph = buildGraph(
          GraphLibrary as unknown as GraphConstructor,
          graphData
        );

        const renderer = new (SigmaLibrary as unknown as SigmaConstructor)(
          graph,
          containerRef.current,
          {
            renderLabels: true,
            labelDensity: 1,
          }
        );
        sigmaInstanceRef.current = renderer;

        const handleNodeClick = async (event: SigmaNodeEvent) => {
          const nodeKey = event.node;
          const [nodeType, nodeId] = nodeKey.split("-");
          const id = Number(nodeId);

          if (Number.isNaN(id)) {
            return;
          }

          const nodeData = graph.getNodeAttributes(nodeKey);

          if (nodeType === "file" && graphData) {
            const fileData = graphData.files.find((file) => file.id === id);
            if (fileData) {
              await openFile(fileData);
              return;
            }
          }

          setSelectedNode({
            type: nodeType as "object" | "file" | "lexicon",
            id,
            label: nodeData.label || nodeKey,
          });
          setDialogOpen(true);
        };

        renderer.on("clickNode", handleNodeClick);

        const handleResize = () => {
          renderer.refresh();
        };

        window.addEventListener("resize", handleResize);

        cleanup = () => {
          window.removeEventListener("resize", handleResize);
          renderer.off("clickNode", handleNodeClick);
          renderer.kill();
        };
      } catch (err) {
        console.error("Failed to initialize Sigma", err);
      }
    };

    void initSigma();

    return () => {
      active = false;
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

    const { type, id } = selectedNode;

    if (type === "object") {
      router.push(`/projects/${projectId}/objects/${id}`);
    } else if (type === "file") {
      router.push(`/projects/${projectId}/files/${id}`);
    } else {
      router.push(`/lexicon/${id}`);
    }

    setDialogOpen(false);
  };

  if (!organizationLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <LoadingSpinner label="Loading organization..." />
        </main>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <EmptyState
            title="No organization selected"
            description="Please select or create an organization to view project graphs."
            action={
              <Button onClick={() => router.push("/dashboard")}>
                Go to dashboard
              </Button>
            }
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
              <Button onClick={() => router.push("/projects")}>
                Go back
              </Button>
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
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/projects/${projectId}`}>{projectName}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Graph</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                System graph {projectName ? `for ${projectName}` : ""}
              </h1>
              <p className="mt-1 text-gray-600">
                Visualize how objects, files, and lexicon items connect within your project.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchGraphData()}
                disabled={loading}
              >
                <RefreshCcw
                  className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
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
              <CardTitle className="text-sm text-gray-500">Lexicon items</CardTitle>
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
              Colors indicate the node or relationship type inside the graph visualization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Nodes</p>
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
              <p className="mb-2 text-sm font-medium text-gray-700">
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
                  <Button onClick={() => void fetchGraphData()}>
                    Retry loading graph
                  </Button>
                }
              />
            ) : loading ? (
              <div className="flex h-[360px] flex-col items-center justify-center text-gray-500">
                <LoadingSpinner
                  label="Loading graph data..."
                  iconClassName="h-6 w-6"
                />
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
            <AlertDialogTitle>
              Navigate to {selectedNode?.label}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to go to the detail page for this
              {" "}
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

export default function ProjectGraphPage() {
  return (
    <PageErrorBoundary fallback={<GraphErrorFallback />}>
      <ProjectGraphPageContent />
    </PageErrorBoundary>
  );
}
