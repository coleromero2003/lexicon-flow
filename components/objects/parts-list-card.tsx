"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, RefreshCw, Table2 } from "lucide-react";
import { PartListEntry, LexiconItem } from "@/lib/supabase/models";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { partListService, lexiconService } from "@/lib/services";
import { useOrganization } from "@clerk/nextjs";
import { toast } from "sonner";

interface PartsListCardProps {
  objectId: number;
  parts: PartListEntry[];
  onUpdate: () => void;
  isHidden?: boolean;
}

export function PartsListCard({
  objectId,
  parts,
  onUpdate,
  isHidden,
}: PartsListCardProps) {
  const { supabase } = useSupabase();
  const { organization } = useOrganization();

  // Add mode: 'lexicon' or 'manual'
  const [addMode, setAddMode] = useState<"lexicon" | "manual" | null>(null);
  const [availableParts, setAvailableParts] = useState<LexiconItem[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [isInitializing, setIsInitializing] = useState(false);

  // Manual part entry fields
  const [manualPart, setManualPart] = useState({
    part_number: "",
    manufacturer: "",
    description: "",
    quantity: "1",
  });

  // Editing state: store index and field being edited
  const [editingCell, setEditingCell] = useState<{
    index: number;
    field: keyof PartListEntry;
    value: string;
  } | null>(null);

  const loadAvailableParts = useCallback(async () => {
    if (!supabase || !organization) return;

    try {
      const items = await lexiconService.getLexiconItemsByType(
        supabase,
        organization.id,
        "part"
      );
      setAvailableParts(items);
    } catch (error) {
      console.error("Error loading parts:", error);
      toast.error("Failed to load available parts");
    }
  }, [supabase, organization]);

  // Load available parts
  useEffect(() => {
    if (organization && addMode === "lexicon") {
      loadAvailableParts();
    }
  }, [organization, addMode, loadAvailableParts]);

  const handleInitializeFromLinks = async () => {
    if (!supabase) return;

    setIsInitializing(true);
    try {
      const initializedParts =
        await partListService.initializePartsListFromLinks(supabase, objectId);

      // Merge with existing parts (don't overwrite existing quantities)
      const existingPartsMap = new Map(parts.map((p) => [p.lexicon_id, p]));
      const mergedParts = initializedParts.map((newPart) => {
        const existing = existingPartsMap.get(newPart.lexicon_id);
        return existing || newPart;
      });

      // Add any existing parts that weren't in the initialized list
      parts.forEach((existingPart) => {
        if (
          !mergedParts.find((p) => p.lexicon_id === existingPart.lexicon_id)
        ) {
          mergedParts.push(existingPart);
        }
      });

      await partListService.updatePartsList(supabase, objectId, mergedParts);
      toast.success("Parts list initialized from linked parts");
      onUpdate();
    } catch (error) {
      console.error("Error initializing parts list:", error);
      toast.error("Failed to initialize parts list");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleAddLexiconPart = async () => {
    if (!supabase) return;

    if (!selectedPartId || !quantity) {
      toast.error("Please select a part and enter a quantity");
      return;
    }

    try {
      await partListService.addPart(
        supabase,
        objectId,
        parseInt(selectedPartId),
        parseInt(quantity)
      );
      toast.success("Part added to list");
      setSelectedPartId("");
      setQuantity("1");
      setAddMode(null);
      onUpdate();
    } catch (error) {
      console.error("Error adding part:", error);
      toast.error("Failed to add part");
    }
  };

  const handleAddManualPart = async () => {
    if (!supabase) return;

    if (
      !manualPart.part_number ||
      !manualPart.manufacturer ||
      !manualPart.quantity
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const qty = parseInt(manualPart.quantity);
    if (isNaN(qty) || qty < 1) {
      toast.error("Please enter a valid quantity");
      return;
    }

    try {
      await partListService.addManualPart(supabase, objectId, {
        part_number: manualPart.part_number,
        manufacturer: manualPart.manufacturer,
        description: manualPart.description,
        quantity: qty,
      });
      toast.success("Manual part added to list");
      setManualPart({
        part_number: "",
        manufacturer: "",
        description: "",
        quantity: "1",
      });
      setAddMode(null);
      onUpdate();
    } catch (error) {
      console.error("Error adding manual part:", error);
      toast.error("Failed to add manual part");
    }
  };

  const handleRemovePart = async (index: number) => {
    if (!supabase) return;

    try {
      await partListService.removePartByIndex(supabase, objectId, index);
      toast.success("Part removed from list");
      onUpdate();
    } catch (error) {
      console.error("Error removing part:", error);
      toast.error("Failed to remove part");
    }
  };

  const handleUpdateCell = async (
    index: number,
    field: keyof PartListEntry,
    value: string
  ) => {
    if (!supabase) return;

    // Validate based on field type
    if (field === "quantity") {
      const qty = parseInt(value);
      if (isNaN(qty) || qty < 0) {
        toast.error("Please enter a valid quantity");
        return;
      }

      try {
        await partListService.updatePartByIndex(supabase, objectId, index, {
          quantity: qty,
        });
        toast.success("Quantity updated");
        setEditingCell(null);
        onUpdate();
      } catch (error) {
        console.error("Error updating quantity:", error);
        toast.error("Failed to update quantity");
      }
    } else {
      // For text fields
      if (!value.trim()) {
        toast.error("Field cannot be empty");
        return;
      }

      try {
        await partListService.updatePartByIndex(supabase, objectId, index, {
          [field]: value.trim(),
        });
        toast.success(`${field.replace("_", " ")} updated`);
        setEditingCell(null);
        onUpdate();
      } catch (error) {
        console.error(`Error updating ${field}:`, error);
        toast.error(`Failed to update ${field.replace("_", " ")}`);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Table2 className="h-5 w-5" />
              Parts List
            </CardTitle>
            <CardDescription>Manage parts for this object</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleInitializeFromLinks}
              disabled={isInitializing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${
                  isInitializing ? "animate-spin" : ""
                }`}
              />
              Initialize from Links
            </Button>
            <Select
              value={addMode || ""}
              onValueChange={(value) =>
                setAddMode(value as "lexicon" | "manual")
              }
            >
              <SelectTrigger className="w-auto border rounded-md px-3 py-2 flex items-center gap-2 text-sm hover:bg-muted">
                <Plus className="h-4 w-4" />
                Add Part
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="lexicon">From Lexicon</SelectItem>
                <SelectItem value="manual">Manual Entry</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      {!isHidden && (
        <CardContent>
          {addMode === "lexicon" && (
            <div className="flex gap-2 mb-4 p-4 bg-gray-50 rounded-lg">
              <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                <SelectTrigger className="flex-1 bg-white">
                  <SelectValue placeholder="Select a part..." />
                </SelectTrigger>
                <SelectContent>
                  {availableParts.map((part) => (
                    <SelectItem key={part.id} value={part.id.toString()}>
                      {part.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Qty"
                className="w-24 bg-white"
              />
              <Button onClick={handleAddLexiconPart} size="sm">
                Add
              </Button>
              <Button
                onClick={() => {
                  setAddMode(null);
                  setSelectedPartId("");
                  setQuantity("1");
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          )}

          {addMode === "manual" && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Part Number *"
                  value={manualPart.part_number}
                  onChange={(e) =>
                    setManualPart({
                      ...manualPart,
                      part_number: e.target.value,
                    })
                  }
                  className="bg-white"
                />
                <Input
                  placeholder="Manufacturer *"
                  value={manualPart.manufacturer}
                  onChange={(e) =>
                    setManualPart({
                      ...manualPart,
                      manufacturer: e.target.value,
                    })
                  }
                  className="bg-white"
                />
              </div>
              <Input
                placeholder="Description"
                value={manualPart.description}
                onChange={(e) =>
                  setManualPart({ ...manualPart, description: e.target.value })
                }
                className="bg-white"
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="Quantity *"
                  value={manualPart.quantity}
                  onChange={(e) =>
                    setManualPart({ ...manualPart, quantity: e.target.value })
                  }
                  className="w-24 bg-white"
                />
                <Button onClick={handleAddManualPart} size="sm">
                  Add
                </Button>
                <Button
                  onClick={() => {
                    setAddMode(null);
                    setManualPart({
                      part_number: "",
                      manufacturer: "",
                      description: "",
                      quantity: "1",
                    });
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {parts.length === 0 ? (
            <EmptyState
              icon={<Table2 className="h-12 w-12" />}
              title="No parts in list"
              description="Add parts to this object or initialize from linked parts"
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24">Quantity</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parts.map((part, index) => {
                    const renderEditableCell = (
                      field: keyof PartListEntry,
                      value: string | number,
                      className?: string
                    ) => {
                      const isEditing =
                        editingCell?.index === index &&
                        editingCell?.field === field;
                      const inputType =
                        field === "quantity" ? "number" : "text";

                      if (isEditing) {
                        return (
                          <Input
                            type={inputType}
                            min={inputType === "number" ? "0" : undefined}
                            value={editingCell.value}
                            onChange={(e) =>
                              setEditingCell({
                                index,
                                field,
                                value: e.target.value,
                              })
                            }
                            onBlur={() =>
                              handleUpdateCell(index, field, editingCell.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUpdateCell(
                                  index,
                                  field,
                                  editingCell.value
                                );
                              } else if (e.key === "Escape") {
                                setEditingCell(null);
                              }
                            }}
                            className={field === "quantity" ? "w-20" : "w-full"}
                            autoFocus
                          />
                        );
                      }

                      return (
                        <span
                          className={`cursor-pointer hover:bg-gray-100 px-2 py-1 rounded block ${
                            className || ""
                          }`}
                          onClick={() =>
                            setEditingCell({
                              index,
                              field,
                              value: value.toString(),
                            })
                          }
                        >
                          {value}
                        </span>
                      );
                    };

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {renderEditableCell("part_number", part.part_number)}
                        </TableCell>
                        <TableCell>
                          {renderEditableCell(
                            "manufacturer",
                            part.manufacturer
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {renderEditableCell(
                            "description",
                            part.description,
                            "truncate"
                          )}
                        </TableCell>
                        <TableCell>
                          {renderEditableCell("quantity", part.quantity)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePart(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
