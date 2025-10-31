"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, PackagePlus } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface LinkableLexiconItem {
  id: number;
  name: string;
  type: string;
}

interface LinkLexiconDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: LinkableLexiconItem[];
  onSubmit: (lexiconId: number, note: string) => Promise<void>;
  isSubmitting?: boolean;
  isLoadingItems?: boolean;
}

export function LinkLexiconDialog({
  open,
  onOpenChange,
  items,
  onSubmit,
  isSubmitting = false,
  isLoadingItems = false,
}: LinkLexiconDialogProps) {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedItemId(null);
      setSearchTerm("");
      setNote("");
    }
  }, [open]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) {
      return items;
    }

    const lowered = searchTerm.toLowerCase();
    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(lowered) ||
        item.type.toLowerCase().includes(lowered)
      );
    });
  }, [items, searchTerm]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  const handleSubmit = async () => {
    if (!selectedItemId) {
      return;
    }

    try {
      await onSubmit(selectedItemId, note.trim());
    } catch (error) {
      console.error("Failed to link lexicon item", error);
    }
  };

  const isSubmitDisabled =
    isSubmitting ||
    isLoadingItems ||
    !selectedItemId ||
    items.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5" />
            Link lexicon item
          </DialogTitle>
          <DialogDescription>
            Attach a reference from your organization&apos;s lexicon to this object.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Lexicon item</Label>
            <div className="rounded-md border">
              <Command>
                <CommandInput
                  placeholder="Search lexicon items..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList>
                  <CommandEmpty>
                    {isLoadingItems
                      ? "Loading lexicon items..."
                      : "No lexicon items available"}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredItems.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={String(item.id)}
                        onSelect={(value) => setSelectedItemId(Number(value))}
                        className="items-start"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedItemId === item.id
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {item.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {item.type.replace(/_/g, " ")}
                            </Badge>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
            {items.length === 0 && !isLoadingItems && (
              <p className="text-xs text-muted-foreground">
                All lexicon items are already linked to this object.
              </p>
            )}
            {selectedItem && (
              <p className="text-xs text-muted-foreground">
                Selected: <span className="font-medium">{selectedItem.name}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lexicon-note">Note (optional)</Label>
            <Textarea
              id="lexicon-note"
              placeholder="Add context for how this lexicon item relates to the object"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
            />
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
            {isSubmitting ? "Linking..." : "Link lexicon item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
