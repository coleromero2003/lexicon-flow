"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { submittalService } from "@/lib/services";
import type { ScadaObject } from "@/lib/supabase/models";

interface SubmittalPDFDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submittalObject: ScadaObject;
}

export function SubmittalPDFDialog({
  open,
  onOpenChange,
  submittalObject,
}: SubmittalPDFDialogProps) {
  const { supabase } = useSupabase();
  const [connectedObjects, setConnectedObjects] = useState<ScadaObject[]>([]);
  const [selectedObjectIds, setSelectedObjectIds] = useState<Set<number>>(
    new Set()
  );
  const [specObjectId, setSpecObjectId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load connected objects when dialog opens
  useEffect(() => {
    if (open && submittalObject) {
      loadConnectedObjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, submittalObject]);

  const loadConnectedObjects = async () => {
    if (!supabase) return;

    setIsLoading(true);
    try {
      const objects = await submittalService.getConnectedObjects(
        supabase,
        submittalObject.id
      );
      setConnectedObjects(objects);

      // Select all objects by default
      const allIds = new Set(objects.map((obj) => obj.id));
      setSelectedObjectIds(allIds);

      // Reset spec selection
      setSpecObjectId(null);
    } catch (error) {
      console.error("Failed to load connected objects:", error);
      toast.error("Failed to load connected objects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleObject = (objectId: number) => {
    const newSelection = new Set(selectedObjectIds);
    if (newSelection.has(objectId)) {
      newSelection.delete(objectId);
    } else {
      newSelection.add(objectId);
    }
    setSelectedObjectIds(newSelection);
  };

  const handleSelectAll = () => {
    const allIds = new Set(connectedObjects.map((obj) => obj.id));
    setSelectedObjectIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedObjectIds(new Set());
  };

  const handleGeneratePDF = async () => {
    if (selectedObjectIds.size === 0) {
      toast.error("Please select at least one object");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/submittal/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submittalObjectId: submittalObject.id,
          selectedObjectIds: Array.from(selectedObjectIds),
          specObjectId: specObjectId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate PDF");
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `submittal-${submittalObject.title
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Submittal PDF generated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate PDF"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Submittal PDF
          </DialogTitle>
          <DialogDescription>
            Select the objects to include in the submittal package and identify
            the specification object.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Spec Object Selection */}
            <div className="space-y-2">
              <Label htmlFor="spec-object">Specification Object (Optional)</Label>
              <Select
                value={specObjectId?.toString() || "none"}
                onValueChange={(value) =>
                  setSpecObjectId(value === "none" ? null : parseInt(value))
                }
              >
                <SelectTrigger id="spec-object">
                  <SelectValue placeholder="Select spec object..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {connectedObjects.map((obj) => (
                    <SelectItem key={obj.id} value={obj.id.toString()}>
                      {obj.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select which object contains the specifications for this submittal.
              </p>
            </div>

            {/* Object Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Connected Objects</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDeselectAll}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              {connectedObjects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No connected objects found. Connect objects to this submittal
                  object first.
                </p>
              ) : (
                <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                  {connectedObjects.map((obj) => (
                    <div
                      key={obj.id}
                      className="flex items-start gap-3 p-3 hover:bg-accent"
                    >
                      <Checkbox
                        id={`object-${obj.id}`}
                        checked={selectedObjectIds.has(obj.id)}
                        onCheckedChange={() => handleToggleObject(obj.id)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`object-${obj.id}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {obj.title}
                        </label>
                        {obj.description_md && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {obj.description_md}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {selectedObjectIds.size} of {connectedObjects.length} objects
                selected
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleGeneratePDF}
            disabled={
              isLoading ||
              isGenerating ||
              selectedObjectIds.size === 0 ||
              connectedObjects.length === 0
            }
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
