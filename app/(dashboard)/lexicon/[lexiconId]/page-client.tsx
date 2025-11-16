"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useOrganization, useUser } from "@clerk/nextjs";
import { BookOpen, Calendar, ClipboardList, Edit2, Layers, Link2, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { PdfViewerDialog } from "@/components/file-viewer/pdf-viewer-dialog";
import { ExcelViewerDialog } from "@/components/file-viewer/excel-viewer-dialog";
import { FilesCard } from "@/components/objects/files-card";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FileRenameDialog } from "@/components/ui/file-rename-dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { lexiconService, objectService, lexiconFileService, fileService } from "@/lib/services";
import { trackScadaOperation } from "@/lib/sentry";
import type { LexiconItem, ScadaObject, FileMeta } from "@/lib/supabase/models";
import { useFileUpload } from "@/lib/hooks/useFileUpload";
import { useSupabaseFileViewer } from "@/lib/hooks/useSupabaseFileViewer";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const typeLabelMap: Record<LexiconItem["type"], string> = {
  part: "Part",
  workflow_template: "Workflow Template",
  step_template: "Step Template",
  document: "Document",
  spec: "Specification",
  client: "Client",
};

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

export default function LexiconDetailClientPage() {
  const params = useParams<{ lexiconId: string }>();
  const router = useRouter();
  const { isSignedIn, isLoaded: userLoaded } = useUser();
  const { organization } = useOrganization();
  const { supabase } = useSupabase();

  const lexiconId = Number(params.lexiconId);

  const [item, setItem] = useState<LexiconItem | null>(null);
  const [linkedObjects, setLinkedObjects] = useState<ScadaObject[]>([]);
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAttributeDialogOpen, setIsAttributeDialogOpen] = useState(false);
  const [newAttributeKey, setNewAttributeKey] = useState("");
  const [newAttributeValue, setNewAttributeValue] = useState("");
  const [editingAttribute, setEditingAttribute] = useState<{ key: string; value: string } | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingLexiconItem, setIsDeletingLexiconItem] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadLexiconFile, isUploading } = useFileUpload();

  const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "lexicon-files";

  const handleFileViewerError = useCallback((error: Error) => {
    toast.error(error.message);
  }, []);

  const { openFile, setViewerOpen, state } = useSupabaseFileViewer({
    supabase,
    bucket: storageBucket,
    onError: handleFileViewerError,
  });

  const { isViewerOpen, viewerFile, viewerUrl, viewerLoading, viewingFileId } = state;

  useEffect(() => {
    if (userLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isSignedIn, userLoaded, router]);

  useEffect(() => {
    if (!supabase || !organization) {
      return;
    }

    if (Number.isNaN(lexiconId)) {
      setError("Invalid lexicon item identifier");
      setLoading(false);
      return;
    }

    const supabaseClient = supabase;

    let isMounted = true;

    async function loadLexiconItem() {
      try {
        setLoading(true);
        setError(null);

        const [lexiconItem, objects, lexiconFiles] = await Promise.all([
          lexiconService.getLexiconItem(supabaseClient, lexiconId),
          objectService.getObjectsByLexicon(supabaseClient, lexiconId),
          lexiconFileService.getFilesForLexicon(supabaseClient, lexiconId),
        ]);

        if (!isMounted) return;

        setItem(lexiconItem);
        setLinkedObjects(objects);
        setFiles(lexiconFiles);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load lexicon item.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadLexiconItem();

    return () => {
      isMounted = false;
    };
  }, [supabase, organization, lexiconId]);

  const attributeEntries = useMemo(() => {
    if (!item) return [] as Array<[string, unknown]>;
    return Object.entries(item.attributes || {});
  }, [item]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !supabase || !item) return;

    // Show the rename dialog instead of uploading immediately
    setFileToUpload(file);
    setIsRenameDialogOpen(true);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [supabase, item]);

  const handleFileDrop = useCallback(async (file: File) => {
    if (!supabase || !item) return;

    // Show the rename dialog instead of uploading immediately
    setFileToUpload(file);
    setIsRenameDialogOpen(true);
  }, [supabase, item]);

  const handleConfirmRename = useCallback(
    async (newFileName: string) => {
      if (!fileToUpload || !item) return;

      try {
        // Create a new File object with the renamed filename
        const renamedFile = new File([fileToUpload], newFileName, {
          type: fileToUpload.type,
        });

        const uploadedFile = await uploadLexiconFile({
          file: renamedFile,
          lexiconId,
          lexiconSlug: item.name,
        });
        setFiles((prev) => [...prev, uploadedFile]);
        toast.success("File uploaded successfully");
      } catch (err) {
        console.error("Failed to upload file", err);
        toast.error("Failed to upload file");
      } finally {
        setFileToUpload(null);
      }
    },
    [fileToUpload, item, lexiconId, uploadLexiconFile]
  );

  const handleCancelRename = useCallback(() => {
    setFileToUpload(null);
  }, []);

  const handleFileDelete = useCallback(async (fileId: number) => {
    if (!supabase) return;

    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "lexicon-files")
        .remove([file.storage_key]);

      if (storageError) throw storageError;

      // Delete file metadata
      await fileService.deleteFile(supabase, fileId);

      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success("File deleted");
    } catch (err) {
      console.error("Failed to delete file", err);
      toast.error("Failed to delete file");
    }
  }, [supabase, files]);

  const handleAddAttribute = useCallback(async () => {
    if (!supabase || !item || !newAttributeKey.trim()) {
      toast.error("Attribute key is required");
      return;
    }

    try {
      const updatedAttributes = {
        ...item.attributes,
        [newAttributeKey.trim()]: newAttributeValue.trim(),
      };

      const updatedItem = await lexiconService.updateLexiconItem(supabase, lexiconId, {
        attributes: updatedAttributes,
      });

      setItem(updatedItem);
      setNewAttributeKey("");
      setNewAttributeValue("");
      setIsAttributeDialogOpen(false);
      toast.success("Attribute added");
    } catch (err) {
      console.error("Failed to add attribute", err);
      toast.error("Failed to add attribute");
    }
  }, [supabase, item, lexiconId, newAttributeKey, newAttributeValue]);

  const handleDeleteAttribute = useCallback(async (key: string) => {
    if (!supabase || !item) return;

    // Prevent deletion of required part attributes
    if (item.type === "part" && (key === "part_number" || key === "manufacturer" || key === "description")) {
      toast.error("Cannot delete required part attributes");
      return;
    }

    try {
      const updatedAttributes = { ...item.attributes };
      delete updatedAttributes[key];

      const updatedItem = await lexiconService.updateLexiconItem(supabase, lexiconId, {
        attributes: updatedAttributes,
      });

      setItem(updatedItem);
      toast.success("Attribute deleted");
    } catch (err) {
      console.error("Failed to delete attribute", err);
      toast.error("Failed to delete attribute");
    }
  }, [supabase, item, lexiconId]);

  const handleDeleteLexiconItem = useCallback(async () => {
    if (!supabase) return;

    setIsDeletingLexiconItem(true);
    try {
      await lexiconService.deleteLexiconItem(supabase, lexiconId);

      // Track successful deletion
      trackScadaOperation(
        "lexicon_delete",
        organization?.id || "unknown",
        true,
        { lexiconId }
      );

      toast.success("Lexicon item deleted successfully");

      // Close dialog first to avoid visual glitches
      setIsDeleteDialogOpen(false);

      // Navigate after a brief delay
      setTimeout(() => {
        router.push("/lexicon");
      }, 100);
    } catch (err) {
      console.error("Failed to delete lexicon item", err);

      // Track failed deletion
      trackScadaOperation(
        "lexicon_delete",
        organization?.id || "unknown",
        false,
        { lexiconId, error: err instanceof Error ? err.message : "Unknown error" }
      );

      // Show actual error message to user
      const errorMessage = err instanceof Error ? err.message : "Failed to delete lexicon item";
      toast.error(errorMessage);
    } finally {
      setIsDeletingLexiconItem(false);
    }
  }, [supabase, lexiconId, router, organization]);

  const handleStartEditAttribute = useCallback((key: string, value: unknown) => {
    // Convert value to string for editing
    let stringValue = "";
    if (typeof value === "string") {
      stringValue = value;
    } else if (value !== null && value !== undefined) {
      stringValue = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
    }

    setEditingAttribute({ key, value: stringValue });
  }, []);

  const handleCancelEditAttribute = useCallback(() => {
    setEditingAttribute(null);
  }, []);

  const handleSaveEditAttribute = useCallback(async () => {
    if (!supabase || !item || !editingAttribute) return;

    const { key, value } = editingAttribute;

    if (!value.trim()) {
      // Check if this is a required field for parts
      if (item.type === "part" && (key === "part_number" || key === "manufacturer" || key === "description")) {
        toast.error("Required part attributes cannot be empty");
        return;
      }
    }

    try {
      const updatedAttributes = {
        ...item.attributes,
        [key]: value.trim(),
      };

      const updatedItem = await lexiconService.updateLexiconItem(supabase, lexiconId, {
        attributes: updatedAttributes,
      });

      setItem(updatedItem);
      setEditingAttribute(null);
      toast.success("Attribute updated");
    } catch (err) {
      console.error("Failed to update attribute", err);
      toast.error("Failed to update attribute");
    }
  }, [supabase, item, lexiconId, editingAttribute]);

  if (!userLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner label="Loading your account..." />
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              No Organization Selected
            </h2>
            <p className="text-gray-600">
              Please select or create an organization to view lexicon items.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto space-y-6 px-4 py-6 sm:py-8">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
          <Skeleton className="h-64" />
        </main>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <Card className="mx-auto max-w-xl">
            <CardHeader>
              <CardTitle>Unable to load lexicon item</CardTitle>
              <CardDescription>{error ?? "We could not find the requested item."}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/lexicon">Back to lexicon</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const formattedCreated = new Date(item.created_at).toLocaleString();
  const formattedUpdated = new Date(item.updated_at).toLocaleString();
  const typeLabel = typeLabelMap[item.type];

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="container mx-auto px-4 py-6 sm:py-8">

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {item.name}
            </h1>
            <p className="mt-1 text-gray-600">
              Reusable {typeLabel.toLowerCase()} for {organization.name}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{typeLabel}</Badge>
              <Badge variant="outline">Version {item.version}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/lexicon">Back to Lexicon</Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General information</CardTitle>
                <CardDescription>
                  Key metadata for this lexicon entry.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoTile
                    icon={<Layers className="h-4 w-4" />}
                    label="Type"
                    value={typeLabel}
                  />
                  <InfoTile
                    icon={<ClipboardList className="h-4 w-4" />}
                    label="Version"
                    value={`v${item.version}`}
                  />
                  <InfoTile
                    icon={<Calendar className="h-4 w-4" />}
                    label="Created"
                    value={formattedCreated}
                  />
                  <InfoTile
                    icon={<Calendar className="h-4 w-4" />}
                    label="Last updated"
                    value={formattedUpdated}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Attributes &amp; notes</CardTitle>
                    <CardDescription>
                      Structured metadata stored with this item.
                    </CardDescription>
                  </div>
                  <Dialog open={isAttributeDialogOpen} onOpenChange={setIsAttributeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add attribute</DialogTitle>
                        <DialogDescription>
                          Add custom metadata to this lexicon item.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="attr-key">Key</Label>
                          <Input
                            id="attr-key"
                            value={newAttributeKey}
                            onChange={(e) => setNewAttributeKey(e.target.value)}
                            placeholder="e.g. voltage_rating"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="attr-value">Value</Label>
                          <Textarea
                            id="attr-value"
                            value={newAttributeValue}
                            onChange={(e) => setNewAttributeValue(e.target.value)}
                            placeholder="e.g. 120V AC"
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAttributeDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddAttribute}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {attributeEntries.length === 0 ? (
                  <EmptyState
                    icon={<BookOpen className="h-8 w-8" />}
                    title="No additional attributes"
                    description="Add notes or structured data to capture specifications for this item."
                  />
                ) : (
                  <div className="grid gap-4">
                    {attributeEntries.map(([key, value]) => {
                      // Prevent deletion of required part attributes
                      const isRequiredPartAttribute = item.type === "part" &&
                        (key === "part_number" || key === "manufacturer" || key === "description");

                      const isEditing = editingAttribute?.key === key;

                      return (
                        <AttributeTile
                          key={key}
                          name={key}
                          value={value}
                          onDelete={isRequiredPartAttribute ? undefined : () => handleDeleteAttribute(key)}
                          onEdit={() => handleStartEditAttribute(key, value)}
                          onSave={handleSaveEditAttribute}
                          onCancel={handleCancelEditAttribute}
                          isRequired={isRequiredPartAttribute}
                          isEditing={isEditing}
                          editValue={isEditing ? editingAttribute.value : undefined}
                          onEditValueChange={
                            isEditing
                              ? (newValue) =>
                                  setEditingAttribute({ key, value: newValue })
                              : undefined
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <FilesCard
              files={files}
              onUpload={() => fileInputRef.current?.click()}
              onFileDrop={handleFileDrop}
              onDelete={handleFileDelete}
              onView={openFile}
              isUploading={isUploading}
              viewingFileId={viewingFileId}
            />
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
            />

            <Card>
              <CardHeader>
                <CardTitle>Associated objects</CardTitle>
                <CardDescription>
                  Objects that reference this lexicon item.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {linkedObjects.length === 0 ? (
                  <EmptyState
                    icon={<Link2 className="h-8 w-8" />}
                    title="No linked objects"
                    description="Objects that reference this item will appear here."
                  />
                ) : (
                  <div className="space-y-4">
                    {linkedObjects.map((object) => (
                      <div
                        key={object.id}
                        className="rounded-lg border border-gray-200 bg-white p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              {object.title}
                            </h3>
                            {object.description_md && (
                              <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                                {object.description_md}
                              </p>
                            )}
                            <p className="mt-2 text-xs text-gray-500">
                              Project #{object.project_id}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/projects/${object.project_id}/objects/${object.id}`}
                            >
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
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

      <FileRenameDialog
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        originalFileName={fileToUpload?.name ?? ""}
        onConfirm={handleConfirmRename}
        onCancel={handleCancelRename}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lexicon Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{item?.name}&rdquo;? This
              action cannot be undone. This item will be permanently removed from
              your organization&apos;s lexicon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingLexiconItem}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLexiconItem}
              disabled={isDeletingLexiconItem}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingLexiconItem ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <div className="rounded-md bg-blue-50 p-2 text-blue-600">{icon}</div>
      <div>
        <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function AttributeTile({
  name,
  value,
  onDelete,
  onEdit,
  onSave,
  onCancel,
  isRequired,
  isEditing,
  editValue,
  onEditValueChange,
}: {
  name: string;
  value: unknown;
  onDelete?: () => void;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  isRequired?: boolean;
  isEditing?: boolean;
  editValue?: string;
  onEditValueChange?: (value: string) => void;
}) {
  const formattedValue = useMemo(() => {
    if (value === null || value === undefined) {
      return "—";
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return value.toString();
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch (err) {
      console.error("Failed to stringify attribute", err);
      return String(value);
    }
  }, [value]);

  const displayName = useMemo(() => name.replace(/_/g, " "), [name]);

  const isMultiline = typeof formattedValue === "string" && formattedValue.includes("\n");

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium uppercase text-gray-500">
            {displayName}
          </p>
          {isRequired && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              Required
            </Badge>
          )}
        </div>
        {isEditing ? (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-3 w-3 text-gray-500" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onSave}>
              <Save className="h-3 w-3 text-green-600" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-1">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit2 className="h-3 w-3 text-blue-500" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="mt-2">
          {isMultiline || (editValue && editValue.length > 50) ? (
            <Textarea
              value={editValue}
              onChange={(e) => onEditValueChange?.(e.target.value)}
              className="w-full font-mono text-sm"
              rows={5}
              autoFocus
            />
          ) : (
            <Input
              value={editValue}
              onChange={(e) => onEditValueChange?.(e.target.value)}
              className="w-full text-sm"
              autoFocus
            />
          )}
        </div>
      ) : (
        <>
          {isMultiline ? (
            <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-900">
              {formattedValue}
            </pre>
          ) : (
            <p className="mt-2 text-sm text-gray-900">{formattedValue}</p>
          )}
        </>
      )}
    </div>
  );
}

