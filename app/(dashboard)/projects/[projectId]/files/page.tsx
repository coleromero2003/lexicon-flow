"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useOrganization, useUser } from "@clerk/nextjs";
import { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PdfViewerDialog } from "@/components/file-viewer/pdf-viewer-dialog";
import { ExcelViewerDialog } from "@/components/file-viewer/excel-viewer-dialog";
import { FilesCard } from "@/components/objects/files-card";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { useSupabaseFileViewer } from "@/lib/hooks/useSupabaseFileViewer";
import { fileService, projectService } from "@/lib/services";
import { FileMeta, Project } from "@/lib/supabase/models";
import { formatFileSize } from "@/lib/utils/format-file-size";
import { Filter, Plus, Search } from "lucide-react";

// Helper to determine if file is an Excel file
function isExcelFile(file: { filename: string; mime_type?: string | null } | null): boolean {
  if (!file) return false;
  const mimeType = (file.mime_type ?? "").toLowerCase();
  const fileName = file.filename.toLowerCase();

  return (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv" ||
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".xlsm") ||
    fileName.endsWith(".xlsb") ||
    fileName.endsWith(".csv")
  );
}

export default function ProjectFilesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectIdNum = Number(projectId);
  const { isSignedIn, isLoaded: userLoaded } = useUser();
  const { organization } = useOrganization();
  const { supabase } = useSupabase();

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const storageBucket = useMemo(() => "lexicon-files", []);

  const handleFileViewerError = useCallback((error: Error) => {
    console.error("Failed to open file", error);
    toast.error(error.message || "Failed to open file");
  }, []);

  const {
    openFile,
    setViewerOpen,
    state: {
      isViewerOpen,
      viewerFile,
      viewerUrl,
      viewerLoading,
      viewingFileId,
    },
  } = useSupabaseFileViewer({
    supabase,
    bucket: storageBucket,
    onError: handleFileViewerError,
  });

  useEffect(() => {
    if (userLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isSignedIn, userLoaded, router]);

  useEffect(() => {
    if (!supabase || !organization || Number.isNaN(projectIdNum)) {
      return;
    }

    let isMounted = true;

    async function loadData(client: SupabaseClient) {
      try {
        setLoading(true);
        setError(null);

        const [projectData, fileData] = await Promise.all([
          projectService.getProjectById(client, projectIdNum),
          fileService.getFilesByProject(client, projectIdNum),
        ]);

        if (!isMounted) return;

        setProject(projectData);
        setFiles(fileData);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load files.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData(supabase);

    return () => {
      isMounted = false;
    };
  }, [supabase, organization, projectIdNum]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredFiles = useMemo(() => {
    if (!normalizedQuery) {
      return files;
    }

    return files.filter((file) =>
      `${file.filename} ${file.mime_type ?? ""}`.toLowerCase().includes(normalizedQuery)
    );
  }, [files, normalizedQuery]);

  const totalSize = useMemo(
    () => filteredFiles.reduce((sum, file) => sum + (file.size_bytes ?? 0), 0),
    [filteredFiles]
  );

  const uniqueMimeTypes = useMemo(() => {
    const types = new Set(filteredFiles.map((file) => file.mime_type ?? "Unknown"));
    return types.size;
  }, [filteredFiles]);

  const filesWithoutMimeType = useMemo(
    () => filteredFiles.filter((file) => !file.mime_type).length,
    [filteredFiles]
  );

  if (!userLoaded || !isSignedIn) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-6 sm:py-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-64" />
        </main>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Organization Selected</h2>
            <p className="text-gray-600">Please select or create an organization to view files.</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {error ? "Error loading files" : "Project not found"}
            </h2>
            <p className="text-gray-600">{error || "We couldn't find the requested project."}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const formattedTotalSize = totalSize > 0 ? formatFileSize(totalSize) : "0 B";

  return (
    <div className="min-h-screen bg-gray-50">
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
                <Link href={`/projects/${projectId}`}>{project.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Files</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Files for {project.name}
              </h1>
              <p className="text-gray-600">Browse and manage project files and documents.</p>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search files..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Files</CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">
                {filteredFiles.length}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Size</CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">
                {formattedTotalSize}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">File Types</CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">
                {uniqueMimeTypes}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Missing Types</CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">
                {filesWithoutMimeType}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <FilesCard
          files={filteredFiles}
          onView={openFile}
          viewingFileId={viewingFileId}
        />
      </main>

      {isExcelFile(viewerFile) ? (
        <ExcelViewerDialog
          open={isViewerOpen}
          onOpenChange={setViewerOpen}
          file={viewerFile}
          url={viewerUrl}
          loading={viewerLoading}
        />
      ) : (
        <PdfViewerDialog
          open={isViewerOpen}
          onOpenChange={setViewerOpen}
          file={viewerFile}
          url={viewerUrl}
          loading={viewerLoading}
        />
      )}
    </div>
  );
}
