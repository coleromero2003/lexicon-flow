"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Link2 } from "lucide-react";

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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RelationKind } from "@/lib/supabase/models";
import type { RELATION_KIND_OPTIONS } from "./constants";

interface LinkableObject {
  id: number;
  title: string;
  description?: string | null;
}

interface LinkObjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objects: LinkableObject[];
  relationKinds: typeof RELATION_KIND_OPTIONS;
  onSubmit: (targetObjectId: number, relationKind: RelationKind) => Promise<void>;
  isSubmitting?: boolean;
  isLoadingObjects?: boolean;
}

export function LinkObjectDialog({
  open,
  onOpenChange,
  objects,
  relationKinds,
  onSubmit,
  isSubmitting = false,
  isLoadingObjects = false,
}: LinkObjectDialogProps) {
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const [selectedRelationKind, setSelectedRelationKind] = useState<RelationKind>(
    relationKinds[0]?.value ?? "mechanical"
  );
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedObjectId(null);
      setSelectedRelationKind(relationKinds[0]?.value ?? "mechanical");
      setSearchTerm("");
    }
  }, [open, relationKinds]);

  const filteredObjects = useMemo(() => {
    if (!searchTerm) return objects;
    const lower = searchTerm.toLowerCase();
    return objects.filter((obj) => obj.title.toLowerCase().includes(lower));
  }, [objects, searchTerm]);

  const selectedObject = useMemo(
    () => objects.find((obj) => obj.id === selectedObjectId) || null,
    [objects, selectedObjectId]
  );

  const handleSubmit = async () => {
    if (!selectedObjectId) {
      return;
    }
    try {
      await onSubmit(selectedObjectId, selectedRelationKind);
    } catch (error) {
      console.error("Failed to link objects", error);
    }
  };

  const isSubmitDisabled =
    isSubmitting || isLoadingObjects || !selectedObjectId || objects.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Link objects
          </DialogTitle>
          <DialogDescription>
            Connect this object to another item in the project and describe how
            they relate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="relation-kind">Relationship type</Label>
            <Select
              value={selectedRelationKind}
              onValueChange={(value) =>
                setSelectedRelationKind(value as RelationKind)
              }
            >
              <SelectTrigger id="relation-kind" className="w-full justify-between">
                <SelectValue placeholder="Select relation" />
              </SelectTrigger>
              <SelectContent>
                {relationKinds.map((kind) => (
                  <SelectItem key={kind.value} value={kind.value}>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{kind.label}</span>
                      <span className="text-muted-foreground text-xs">
                        {kind.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Object</Label>
            <div className="rounded-md border">
              <Command>
                <CommandInput
                  placeholder="Search objects..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList>
                  <CommandEmpty>
                    {isLoadingObjects
                      ? "Loading objects..."
                      : "No available objects to link"}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredObjects.map((object) => (
                      <CommandItem
                        key={object.id}
                        value={String(object.id)}
                        onSelect={(value) => {
                          const id = Number(value);
                          setSelectedObjectId(id);
                        }}
                        className="items-start"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedObjectId === object.id
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium">
                            {object.title}
                          </span>
                          {object.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {object.description}
                            </p>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
            {objects.length === 0 && !isLoadingObjects && (
              <p className="text-xs text-muted-foreground">
                All other objects in this project are already connected.
              </p>
            )}
            {selectedObject && (
              <p className="text-xs text-muted-foreground">
                Selected: <span className="font-medium">{selectedObject.title}</span>
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
            {isSubmitting ? "Linking..." : "Link object"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
