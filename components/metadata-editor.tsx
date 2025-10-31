"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface MetadataEditorProps {
  metadata: Record<string, unknown>;
  onUpdate: (metadata: Record<string, unknown>) => void;
  suggestions?: string[]; // Property key suggestions from other objects
  disabled?: boolean;
}

type ValueType = "string" | "number" | "boolean" | "object" | "array";

// Helper functions for key formatting
function formatKeyForStorage(key: string): string {
  return key.toLowerCase().replace(/\s+/g, "_");
}

function formatKeyForDisplay(key: string): string {
  return key.replace(/_/g, " ");
}

// Helper to detect value type
function getValueType(value: unknown): ValueType {
  if (Array.isArray(value)) return "array";
  if (value === null || value === undefined) return "string";
  if (typeof value === "object") return "object";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "string";
}

// Helper to parse value based on type
function parseValue(value: string, type: ValueType): unknown {
  try {
    if (type === "number") return parseFloat(value);
    if (type === "boolean") return value === "true";
    if (type === "object" || type === "array") {
      return JSON.parse(value);
    }
    return value;
  } catch {
    return value;
  }
}

// Helper to format value for display
function formatValue(value: unknown): string {
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

export function MetadataEditor({
  metadata,
  onUpdate,
  suggestions = [],
  disabled = false,
}: MetadataEditorProps) {
  const [entries, setEntries] = useState<Array<{ key: string; value: unknown; type: ValueType }>>(
    []
  );
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newValueType, setNewValueType] = useState<ValueType>("string");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editValueType, setEditValueType] = useState<ValueType>("string");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [jsonError, setJsonError] = useState<string>("");

  // Convert metadata object to entries array
  useEffect(() => {
    const metadataEntries = Object.entries(metadata || {}).map(([key, value]) => ({
      key,
      value,
      type: getValueType(value),
    }));
    setEntries(metadataEntries);
  }, [metadata]);

  const handleAdd = () => {
    if (!newKey.trim() || (!newValue.trim() && newValueType !== "boolean")) return;

    const formattedKey = formatKeyForStorage(newKey.trim());

    // Check if key already exists
    if (entries.some((e) => e.key === formattedKey)) {
      alert("A property with this key already exists");
      return;
    }

    // Validate JSON for object/array types
    if (newValueType === "object" || newValueType === "array") {
      try {
        JSON.parse(newValue);
        setJsonError("");
      } catch {
        setJsonError("Invalid JSON format");
        return;
      }
    }

    const parsedValue = parseValue(newValue.trim(), newValueType);
    const updatedMetadata = {
      ...metadata,
      [formattedKey]: parsedValue,
    };

    onUpdate(updatedMetadata);
    setNewKey("");
    setNewValue("");
    setNewValueType("string");
    setIsAdding(false);
    setSuggestionsOpen(false);
    setJsonError("");
  };

  const handleEdit = (key: string, value: unknown, type: ValueType) => {
    setEditingKey(key);
    setEditValue(formatValue(value));
    setEditValueType(type);
    setJsonError("");
  };

  const handleSaveEdit = (key: string) => {
    if (!editValue.trim() && editValueType !== "boolean") return;

    // Validate JSON for object/array types
    if (editValueType === "object" || editValueType === "array") {
      try {
        JSON.parse(editValue);
        setJsonError("");
      } catch {
        setJsonError("Invalid JSON format");
        return;
      }
    }

    const parsedValue = parseValue(editValue.trim(), editValueType);
    const updatedMetadata = {
      ...metadata,
      [key]: parsedValue,
    };

    onUpdate(updatedMetadata);
    setEditingKey(null);
    setEditValue("");
    setEditValueType("string");
    setJsonError("");
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
    setEditValueType("string");
    setJsonError("");
  };

  const toggleExpanded = (key: string) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedKeys(newExpanded);
  };

  const handleDelete = (key: string) => {
    const updatedMetadata = { ...metadata };
    delete updatedMetadata[key];
    onUpdate(updatedMetadata);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setNewKey(formatKeyForDisplay(suggestion));
    setSuggestionsOpen(false);
  };

  return (
    <div className="space-y-3">
      {entries.length === 0 && !isAdding && (
        <p className="text-sm text-gray-500 text-center py-4">
          No properties defined
        </p>
      )}

      {entries.map(({ key, value, type }) => (
        <div key={key} className="flex items-start gap-2 group">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {(type === "object" || type === "array") && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0"
                  onClick={() => toggleExpanded(key)}
                >
                  {expandedKeys.has(key) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              )}
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {formatKeyForDisplay(key)}
              </p>
              <span className="text-xs text-gray-400">({type})</span>
            </div>
            {editingKey === key ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-xs">Type:</Label>
                  <Select
                    value={editValueType}
                    onValueChange={(value) => setEditValueType(value as ValueType)}
                  >
                    <SelectTrigger className="h-7 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="object">Object (JSON)</SelectItem>
                      <SelectItem value="array">Array (JSON)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editValueType === "boolean" ? (
                  <Select value={editValue} onValueChange={setEditValue}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                ) : editValueType === "object" || editValueType === "array" ? (
                  <Textarea
                    value={editValue}
                    onChange={(e) => {
                      setEditValue(e.target.value);
                      setJsonError("");
                    }}
                    className="text-sm font-mono min-h-[100px]"
                    autoFocus
                    disabled={disabled}
                    placeholder={editValueType === "array" ? '["item1", "item2"]' : '{"key": "value"}'}
                  />
                ) : (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit(key);
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    className="h-8 text-sm"
                    type={editValueType === "number" ? "number" : "text"}
                    autoFocus
                    disabled={disabled}
                  />
                )}
                {jsonError && <p className="text-xs text-red-600">{jsonError}</p>}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleSaveEdit(key)}
                    disabled={disabled}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {type === "object" || type === "array" ? (
                  <div className="bg-gray-50 rounded p-2 border">
                    {expandedKeys.has(key) ? (
                      <pre className="text-xs font-mono whitespace-pre-wrap overflow-auto max-h-48">
                        {formatValue(value)}
                      </pre>
                    ) : (
                      <p className="text-sm text-gray-600 truncate">
                        {type === "array"
                          ? `Array [${(value as unknown[])?.length || 0} items]`
                          : `Object {${Object.keys(value as Record<string, unknown> || {}).length} properties}`}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-900">{formatValue(value)}</p>
                )}
              </div>
            )}
          </div>
          {editingKey !== key && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEdit(key, value, type)}
                disabled={disabled}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(key)}
                className="text-red-600 hover:text-red-700"
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ))}

      {isAdding && (
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg border-2 border-blue-200">
          <div className="space-y-1">
            <Label htmlFor="new-key" className="text-xs">
              Property Name
            </Label>
            {suggestions.length > 0 ? (
              <Popover open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      id="new-key"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="e.g., Serial Number or parts_list"
                      className="h-8 text-sm"
                      onFocus={() => setSuggestionsOpen(true)}
                      disabled={disabled}
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search suggestions..." />
                    <CommandList>
                      <CommandEmpty>No suggestions found.</CommandEmpty>
                      <CommandGroup heading="Common Properties">
                        {suggestions.map((suggestion) => (
                          <CommandItem
                            key={suggestion}
                            value={suggestion}
                            onSelect={() => handleSuggestionSelect(suggestion)}
                          >
                            {formatKeyForDisplay(suggestion)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <Input
                id="new-key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g., Serial Number or parts_list"
                className="h-8 text-sm"
                disabled={disabled}
              />
            )}
            <p className="text-xs text-gray-500">
              Will be stored as: {formatKeyForStorage(newKey || "property_name")}
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-type" className="text-xs">
              Value Type
            </Label>
            <Select
              value={newValueType}
              onValueChange={(value) => {
                setNewValueType(value as ValueType);
                // Set default values for different types
                if (value === "boolean") setNewValue("false");
                if (value === "number") setNewValue("0");
                if (value === "array") setNewValue("[]");
                if (value === "object") setNewValue("{}");
                if (value === "string") setNewValue("");
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="object">Object (JSON)</SelectItem>
                <SelectItem value="array">Array (JSON)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-value" className="text-xs">
              Value
            </Label>
            {newValueType === "boolean" ? (
              <Select value={newValue} onValueChange={setNewValue}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            ) : newValueType === "object" || newValueType === "array" ? (
              <>
                <Textarea
                  id="new-value"
                  value={newValue}
                  onChange={(e) => {
                    setNewValue(e.target.value);
                    setJsonError("");
                  }}
                  placeholder={
                    newValueType === "array"
                      ? '[{"part": "Widget A", "quantity": 10, "box": "Box 1"}]'
                      : '{"key": "value"}'
                  }
                  className="text-sm font-mono min-h-[100px]"
                  disabled={disabled}
                />
                <p className="text-xs text-gray-500">
                  {newValueType === "array" && newKey.toLowerCase().includes("parts")
                    ? 'Example: [{"part": "Widget A", "quantity": 10, "box": "Box 1"}]'
                    : "Enter valid JSON"}
                </p>
              </>
            ) : (
              <Input
                id="new-value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={newValueType === "number" ? "0" : "Enter value"}
                className="h-8 text-sm"
                type={newValueType === "number" ? "number" : "text"}
                onKeyDown={(e) => {
                  const valueType = newValueType as ValueType;
                  if (e.key === "Enter" && valueType !== "object" && valueType !== "array") handleAdd();
                  if (e.key === "Escape") {
                    setIsAdding(false);
                    setNewKey("");
                    setNewValue("");
                    setNewValueType("string");
                    setJsonError("");
                  }
                }}
                disabled={disabled}
              />
            )}
            {jsonError && <p className="text-xs text-red-600">{jsonError}</p>}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} size="sm" disabled={disabled}>
              <Check className="h-4 w-4 mr-1" />
              Add Property
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewKey("");
                setNewValue("");
                setNewValueType("string");
                setSuggestionsOpen(false);
                setJsonError("");
              }}
              disabled={disabled}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!isAdding && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="w-full"
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Property
        </Button>
      )}
    </div>
  );
}
