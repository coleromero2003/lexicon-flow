"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Part, ScadaObject } from "@/lib/supabase/models";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Trash2, Plus, Check, ChevronsUpDown, Search, ExternalLink, GripVertical, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParts } from "@/lib/hooks/useParts";
import { useProjects } from "@/lib/hooks/useProjects";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { objectService } from "@/lib/services";
import {
  exportPartsToCSV,
  exportPartsToXLSX,
  generatePartsExportFilename,
} from "@/lib/utils/parts-export";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PartsTableProps {
  projectId?: number;
  objectId?: number;
  showProjectColumn?: boolean;
  showObjectColumn?: boolean;
}

interface EditingCell {
  partId: number;
  field: keyof Part;
}

interface NavigationDialog {
  type: "project" | "object";
  id: number;
  name: string;
}

interface ColumnDef {
  id: string;
  label: string;
  minWidth?: string;
  align?: "left" | "center" | "right";
  defaultWidth?: number;
}

function SortableTableHead({
  column,
  children,
  width,
  onResize,
}: {
  column: ColumnDef;
  children: React.ReactNode;
  width: number;
  onResize: (columnId: string, width: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    width: `${width}px`,
    minWidth: `${width}px`,
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - resizeStartX.current;
      const newWidth = Math.max(80, resizeStartWidth.current + delta);
      onResize(column.id, newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        "whitespace-nowrap border-r border-gray-200 last:border-r-0 relative",
        column.align === "center" && "text-center",
        column.align === "right" && "text-right",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        {children}
      </div>
      {/* Resize Handle */}
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500 hover:w-1.5 transition-all",
          isResizing && "bg-blue-500 w-1.5"
        )}
        onMouseDown={handleResizeStart}
        style={{ zIndex: 10 }}
      />
    </TableHead>
  );
}

export function PartsTable({
  projectId,
  objectId,
  showProjectColumn = true,
  showObjectColumn = true,
}: PartsTableProps) {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { parts, createPart, updatePart, deletePart, loading } = useParts({
    projectId,
    objectId,
  });
  const { projects } = useProjects();

  // Define all possible columns with default widths
  const allColumns: ColumnDef[] = useMemo(() => [
    { id: "part_number", label: "Part Number", defaultWidth: 150 },
    { id: "description", label: "Description", defaultWidth: 250 },
    { id: "quantity", label: "Quantity", align: "center", defaultWidth: 100 },
    ...(showProjectColumn ? [{ id: "project", label: "Project", defaultWidth: 180 }] : []),
    ...(showObjectColumn ? [{ id: "object", label: "Object", defaultWidth: 180 }] : []),
    { id: "ordered", label: "Ordered", align: "center" as const, defaultWidth: 120 },
    { id: "received", label: "Received", align: "center" as const, defaultWidth: 120 },
    { id: "delivered", label: "Delivered", align: "center" as const, defaultWidth: 120 },
    { id: "comments", label: "Comments", defaultWidth: 200 },
    { id: "actions", label: "Actions", align: "right" as const, defaultWidth: 100 },
  ], [showProjectColumn, showObjectColumn]);

  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState<number | null>(null);
  const [navigationDialog, setNavigationDialog] = useState<NavigationDialog | null>(null);
  const [objects, setObjects] = useState<Record<number, ScadaObject>>({});

  const [newPart, setNewPart] = useState({
    part_number: "",
    description: "",
    quantity: 1,
    project_id: projectId || 0,
    object_id: objectId || null,
    lexicon_item_id: null,
    comments: "",
    ordered: false,
    ordered_date: null,
    received: false,
    received_date: null,
    delivered: false,
    delivered_date: null,
  });

  // Initialize and update column order and widths when columns change
  useEffect(() => {
    const newColumns = allColumns.map(c => c.id);
    setColumnOrder(newColumns);

    // Initialize column widths with defaults
    const initialWidths: Record<string, number> = {};
    allColumns.forEach(col => {
      if (!columnWidths[col.id]) {
        initialWidths[col.id] = col.defaultWidth || 150;
      }
    });
    setColumnWidths(prev => ({ ...prev, ...initialWidths }));
  }, [allColumns]);

  // Get ordered columns
  const orderedColumns = useMemo(() => {
    return columnOrder
      .map(id => allColumns.find(c => c.id === id))
      .filter((c): c is ColumnDef => c !== undefined);
  }, [columnOrder, allColumns]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleColumnResize = (columnId: string, width: number) => {
    setColumnWidths(prev => ({ ...prev, [columnId]: width }));
  };

  // Fetch objects for parts that have object_id
  useEffect(() => {
    async function fetchObjects() {
      if (!supabase) return;

      const objectIds = parts
        .filter(part => part.object_id)
        .map(part => part.object_id as number);

      if (objectIds.length === 0) return;

      try {
        const uniqueObjectIds = Array.from(new Set(objectIds));
        const fetchedObjects = await Promise.all(
          uniqueObjectIds.map(id => objectService.getObject(supabase, id))
        );

        const objectMap: Record<number, ScadaObject> = {};
        fetchedObjects.forEach(obj => {
          if (obj) objectMap[obj.id] = obj;
        });

        setObjects(objectMap);
      } catch (error) {
        console.error("Failed to fetch objects:", error);
      }
    }

    fetchObjects();
  }, [parts, supabase]);

  // Filter parts based on search query
  const filteredParts = useMemo(() => {
    if (!searchQuery) return parts;

    const query = searchQuery.toLowerCase();
    return parts.filter(part => {
      const projectName = projects.find(p => p.id === part.project_id)?.name?.toLowerCase() || "";
      const objectName = part.object_id ? objects[part.object_id]?.title?.toLowerCase() || "" : "";

      return (
        part.part_number.toLowerCase().includes(query) ||
        part.description.toLowerCase().includes(query) ||
        part.comments?.toLowerCase().includes(query) ||
        projectName.includes(query) ||
        objectName.includes(query)
      );
    });
  }, [parts, searchQuery, projects, objects]);

  const handleCellClick = (partId: number, field: keyof Part, currentValue: unknown) => {
    setEditingCell({ partId, field });
    setEditValue(String(currentValue || ""));
  };

  const handleCellBlur = async (partId: number, field: keyof Part) => {
    if (editingCell?.partId === partId && editingCell?.field === field) {
      try {
        // Convert value based on field type
        let value: unknown = editValue;
        if (field === "quantity") {
          value = parseInt(editValue) || 1;
        } else if (field === "project_id" || field === "object_id" || field === "lexicon_item_id") {
          value = editValue ? parseInt(editValue) : null;
        }

        await updatePart(partId, { [field]: value });
      } catch (error) {
        console.error("Failed to update part:", error);
      }
      setEditingCell(null);
    }
  };

  const handleCheckboxChange = async (
    partId: number,
    field: "ordered" | "received" | "delivered",
    checked: boolean
  ) => {
    const dateField = `${field}_date` as keyof Part;
    await updatePart(partId, {
      [field]: checked,
      [dateField]: checked ? new Date().toISOString() : null,
    });
  };

  const handleAddNew = async () => {
    if (!newPart.part_number || !newPart.description || !newPart.project_id) {
      alert("Part number, description, and project are required");
      return;
    }

    try {
      await createPart(newPart);
      setIsAddingNew(false);
      setNewPart({
        part_number: "",
        description: "",
        quantity: 1,
        project_id: projectId || 0,
        object_id: objectId || null,
        lexicon_item_id: null,
        comments: "",
        ordered: false,
        ordered_date: null,
        received: false,
        received_date: null,
        delivered: false,
        delivered_date: null,
      });
    } catch (error) {
      console.error("Failed to create part:", error);
    }
  };

  const handleDeleteClick = (partId: number) => {
    setPartToDelete(partId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (partToDelete) {
      await deletePart(partToDelete);
      setPartToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleNavigationClick = (type: "project" | "object", id: number, name: string) => {
    setNavigationDialog({ type, id, name });
  };

  const handleNavigationConfirm = () => {
    if (navigationDialog) {
      if (navigationDialog.type === "project") {
        router.push(`/projects/${navigationDialog.id}`);
      } else {
        // Find the project_id for this object
        const part = parts.find(p => p.object_id === navigationDialog.id);
        if (part) {
          router.push(`/projects/${part.project_id}/objects/${navigationDialog.id}`);
        }
      }
      setNavigationDialog(null);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString();
  };

  const handleExportCSV = () => {
    try {
      if (filteredParts.length === 0) {
        toast.error("No parts to export");
        return;
      }

      const filename = objectId
        ? generatePartsExportFilename(
            objects[objectId]?.title || `object-${objectId}`,
            "csv"
          )
        : "parts-list.csv";

      exportPartsToCSV(filteredParts, filename);
      toast.success("Parts exported to CSV successfully");
    } catch (error) {
      console.error("Failed to export parts to CSV:", error);
      toast.error("Failed to export parts to CSV");
    }
  };

  const handleExportXLSX = () => {
    try {
      if (filteredParts.length === 0) {
        toast.error("No parts to export");
        return;
      }

      const filename = objectId
        ? generatePartsExportFilename(
            objects[objectId]?.title || `object-${objectId}`,
            "xlsx"
          )
        : "parts-list.xlsx";

      exportPartsToXLSX(filteredParts, filename);
      toast.success("Parts exported to Excel successfully");
    } catch (error) {
      console.error("Failed to export parts to Excel:", error);
      toast.error("Failed to export parts to Excel");
    }
  };

  // Render cell content based on column ID
  const renderCell = (columnId: string, part: Part, isNewRow = false) => {
    const width = columnWidths[columnId] || 150;
    const cellClass = cn(
      "border-r border-gray-200 last:border-r-0",
    );
    const cellStyle = {
      width: `${width}px`,
      minWidth: `${width}px`,
      maxWidth: `${width}px`,
    };

    if (isNewRow) {
      // Render new row cells
      switch (columnId) {
        case "part_number":
          return (
            <TableCell key={columnId} className={cellClass} style={cellStyle}>
              <Input
                value={newPart.part_number}
                onChange={(e) => setNewPart({ ...newPart, part_number: e.target.value })}
                placeholder="Part number *"
                className="h-8"
              />
            </TableCell>
          );
        case "description":
          return (
            <TableCell key={columnId} className={cellClass} style={cellStyle}>
              <Input
                value={newPart.description}
                onChange={(e) => setNewPart({ ...newPart, description: e.target.value })}
                placeholder="Description *"
                className="h-8"
              />
            </TableCell>
          );
        case "quantity":
          return (
            <TableCell key={columnId} className={cellClass} style={cellStyle}>
              <Input
                type="number"
                value={newPart.quantity}
                onChange={(e) => setNewPart({ ...newPart, quantity: parseInt(e.target.value) || 1 })}
                min="1"
                className="h-8 w-20"
              />
            </TableCell>
          );
        case "project":
          return (
            <TableCell key={columnId} className={cellClass} style={cellStyle}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="h-8 w-full justify-between">
                    {newPart.project_id
                      ? projects.find((p) => p.id === newPart.project_id)?.name
                      : "Select project *"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search projects..." />
                    <CommandList>
                      <CommandEmpty>No project found.</CommandEmpty>
                      <CommandGroup>
                        {projects.map((project) => (
                          <CommandItem
                            key={project.id}
                            value={project.name}
                            onSelect={() => setNewPart({ ...newPart, project_id: project.id })}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                newPart.project_id === project.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {project.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </TableCell>
          );
        case "object":
        case "ordered":
        case "received":
        case "delivered":
          return (
            <TableCell key={columnId} className={cn(cellClass, "text-center")} style={cellStyle}>
              -
            </TableCell>
          );
        case "comments":
          return (
            <TableCell key={columnId} className={cellClass} style={cellStyle}>
              <Input
                value={newPart.comments}
                onChange={(e) => setNewPart({ ...newPart, comments: e.target.value })}
                placeholder="Comments"
                className="h-8"
              />
            </TableCell>
          );
        case "actions":
          return (
            <TableCell key={columnId} className={cn(cellClass, "text-right space-x-2")} style={cellStyle}>
              <Button size="sm" onClick={handleAddNew}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setIsAddingNew(false)}>Cancel</Button>
            </TableCell>
          );
        default:
          return <TableCell key={columnId} className={cellClass} style={cellStyle}>-</TableCell>;
      }
    }

    // Render existing part cells
    switch (columnId) {
      case "part_number":
        return (
          <TableCell
            key={columnId}
            onClick={() => handleCellClick(part.id, "part_number", part.part_number)}
            className={cn(cellClass, "cursor-pointer hover:bg-muted/50")}
            style={cellStyle}
          >
            {editingCell?.partId === part.id && editingCell?.field === "part_number" ? (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellBlur(part.id, "part_number")}
                onKeyDown={(e) => e.key === "Enter" && handleCellBlur(part.id, "part_number")}
                autoFocus
                className="h-8"
              />
            ) : (
              part.part_number
            )}
          </TableCell>
        );
      case "description":
        return (
          <TableCell
            key={columnId}
            onClick={() => handleCellClick(part.id, "description", part.description)}
            className={cn(cellClass, "cursor-pointer hover:bg-muted/50")}
            style={cellStyle}
          >
            {editingCell?.partId === part.id && editingCell?.field === "description" ? (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellBlur(part.id, "description")}
                onKeyDown={(e) => e.key === "Enter" && handleCellBlur(part.id, "description")}
                autoFocus
                className="h-8"
              />
            ) : (
              part.description
            )}
          </TableCell>
        );
      case "quantity":
        return (
          <TableCell
            key={columnId}
            onClick={() => handleCellClick(part.id, "quantity", part.quantity)}
            className={cn(cellClass, "cursor-pointer hover:bg-muted/50 text-center")}
            style={cellStyle}
          >
            {editingCell?.partId === part.id && editingCell?.field === "quantity" ? (
              <Input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellBlur(part.id, "quantity")}
                onKeyDown={(e) => e.key === "Enter" && handleCellBlur(part.id, "quantity")}
                autoFocus
                min="1"
                className="h-8 w-20"
              />
            ) : (
              part.quantity
            )}
          </TableCell>
        );
      case "project":
        const project = projects.find((p) => p.id === part.project_id);
        return (
          <TableCell key={columnId} className={cellClass} style={cellStyle}>
            {project ? (
              <Button
                variant="link"
                className="p-0 h-auto font-normal text-blue-600 hover:text-blue-800"
                onClick={() => handleNavigationClick("project", project.id, project.name)}
              >
                {project.name}
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            ) : (
              "Unknown"
            )}
          </TableCell>
        );
      case "object":
        return (
          <TableCell key={columnId} className={cellClass} style={cellStyle}>
            {part.object_id && objects[part.object_id] ? (
              <Button
                variant="link"
                className="p-0 h-auto font-normal text-blue-600 hover:text-blue-800"
                onClick={() =>
                  handleNavigationClick("object", part.object_id!, objects[part.object_id!].title)
                }
              >
                {objects[part.object_id].title}
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            ) : (
              "-"
            )}
          </TableCell>
        );
      case "ordered":
      case "received":
      case "delivered":
        const field = columnId as "ordered" | "received" | "delivered";
        const dateField = `${field}_date` as keyof Part;
        return (
          <TableCell key={columnId} className={cn(cellClass, "text-center")} style={cellStyle}>
            <div className="flex flex-col items-center gap-1">
              <Checkbox
                checked={part[field]}
                onCheckedChange={(checked) => handleCheckboxChange(part.id, field, checked as boolean)}
              />
              {part[dateField] && (
                <span className="text-xs text-muted-foreground">
                  {formatDate(part[dateField] as string)}
                </span>
              )}
            </div>
          </TableCell>
        );
      case "comments":
        return (
          <TableCell
            key={columnId}
            onClick={() => handleCellClick(part.id, "comments", part.comments)}
            className={cn(cellClass, "cursor-pointer hover:bg-muted/50")}
            style={cellStyle}
          >
            {editingCell?.partId === part.id && editingCell?.field === "comments" ? (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellBlur(part.id, "comments")}
                onKeyDown={(e) => e.key === "Enter" && handleCellBlur(part.id, "comments")}
                autoFocus
                className="h-8"
              />
            ) : (
              part.comments || "-"
            )}
          </TableCell>
        );
      case "actions":
        return (
          <TableCell key={columnId} className={cn(cellClass, "text-right")} style={cellStyle}>
            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(part.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </TableCell>
        );
      default:
        return <TableCell key={columnId} className={cellClass} style={cellStyle}>-</TableCell>;
    }
  };

  if (loading) {
    return <div className="p-4">Loading parts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">Parts</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search parts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full sm:w-[250px]"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={filteredParts.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportXLSX}>
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Part
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader>
              <TableRow className="border-b-2">
                <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                  {orderedColumns.map((column) => (
                    <SortableTableHead
                      key={column.id}
                      column={column}
                      width={columnWidths[column.id] || column.defaultWidth || 150}
                      onResize={handleColumnResize}
                    >
                      {column.label}
                    </SortableTableHead>
                  ))}
                </SortableContext>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isAddingNew && (
                <TableRow className="border-b">
                  {orderedColumns.map((column) => renderCell(column.id, {} as Part, true))}
                </TableRow>
              )}
              {filteredParts.map((part) => (
                <TableRow key={part.id} className="border-b">
                  {orderedColumns.map((column) => renderCell(column.id, part))}
                </TableRow>
              ))}
              {filteredParts.length === 0 && !isAddingNew && (
                <TableRow>
                  <TableCell
                    colSpan={orderedColumns.length}
                    className="text-center text-muted-foreground py-8"
                  >
                    {searchQuery
                      ? "No parts found matching your search."
                      : 'No parts found. Click "Add Part" to create one.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Part</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this part? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Navigation Confirmation Dialog */}
      <AlertDialog
        open={!!navigationDialog}
        onOpenChange={(open) => !open && setNavigationDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Go to {navigationDialog?.type === "project" ? "Project" : "Object"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to navigate to {navigationDialog?.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleNavigationConfirm}>
              Go to {navigationDialog?.type === "project" ? "Project" : "Object"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
