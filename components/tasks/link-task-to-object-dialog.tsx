"use client";

import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ScadaObject } from "@/lib/supabase/models";

interface LinkTaskToObjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objects: ScadaObject[];
  onSubmit: (objectId: number) => Promise<void>;
  isSubmitting?: boolean;
  isLoadingObjects?: boolean;
}

export function LinkTaskToObjectDialog({
  open,
  onOpenChange,
  objects,
  onSubmit,
  isSubmitting = false,
  isLoadingObjects = false,
}: LinkTaskToObjectDialogProps) {
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredObjects, setFilteredObjects] = useState<ScadaObject[]>([]);

  // Filter objects based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredObjects(objects);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredObjects(
        objects.filter(
          (obj) =>
            obj.title.toLowerCase().includes(query) ||
            obj.description_md?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, objects]);

  // Reset when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedObjectId(null);
      setSearchQuery("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedObjectId) return;

    try {
      await onSubmit(selectedObjectId);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to link task to object", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Link Task to Object</DialogTitle>
          <DialogDescription>
            Select an object to associate this task with.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Objects</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Object Selection */}
          <div className="space-y-2">
            <Label htmlFor="object">Select Object</Label>
            {isLoadingObjects ? (
              <p className="text-sm text-gray-500">Loading objects...</p>
            ) : filteredObjects.length === 0 ? (
              <p className="text-sm text-gray-500">
                {searchQuery ? "No objects found matching your search." : "No objects available."}
              </p>
            ) : (
              <Select
                value={selectedObjectId?.toString() || ""}
                onValueChange={(value) => setSelectedObjectId(Number(value))}
              >
                <SelectTrigger id="object">
                  <SelectValue placeholder="Choose an object..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredObjects.map((obj) => (
                    <SelectItem key={obj.id} value={obj.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{obj.title}</span>
                        {obj.description_md && (
                          <span className="text-xs text-gray-500 line-clamp-1">
                            {obj.description_md}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedObjectId || isSubmitting}
          >
            {isSubmitting ? "Linking..." : "Link to Object"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
