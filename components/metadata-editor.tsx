"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
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

interface MetadataEditorProps {
  metadata: Record<string, unknown>;
  onUpdate: (metadata: Record<string, unknown>) => void;
  suggestions?: string[]; // Property key suggestions from other objects
  disabled?: boolean;
}

// Helper functions for key formatting
function formatKeyForStorage(key: string): string {
  return key.toLowerCase().replace(/\s+/g, "_");
}

function formatKeyForDisplay(key: string): string {
  return key.replace(/_/g, " ");
}

export function MetadataEditor({
  metadata,
  onUpdate,
  suggestions = [],
  disabled = false,
}: MetadataEditorProps) {
  const [entries, setEntries] = useState<Array<{ key: string; value: string }>>(
    []
  );
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  // Convert metadata object to entries array
  useEffect(() => {
    const metadataEntries = Object.entries(metadata || {}).map(([key, value]) => ({
      key,
      value: String(value),
    }));
    setEntries(metadataEntries);
  }, [metadata]);

  const handleAdd = () => {
    if (!newKey.trim() || !newValue.trim()) return;

    const formattedKey = formatKeyForStorage(newKey.trim());

    // Check if key already exists
    if (entries.some((e) => e.key === formattedKey)) {
      alert("A property with this key already exists");
      return;
    }

    const updatedMetadata = {
      ...metadata,
      [formattedKey]: newValue.trim(),
    };

    onUpdate(updatedMetadata);
    setNewKey("");
    setNewValue("");
    setIsAdding(false);
    setSuggestionsOpen(false);
  };

  const handleEdit = (key: string) => {
    setEditingKey(key);
    setEditValue(String(metadata[key] || ""));
  };

  const handleSaveEdit = (key: string) => {
    if (!editValue.trim()) return;

    const updatedMetadata = {
      ...metadata,
      [key]: editValue.trim(),
    };

    onUpdate(updatedMetadata);
    setEditingKey(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
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

      {entries.map(({ key, value }) => (
        <div key={key} className="flex items-center gap-2 group">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              {formatKeyForDisplay(key)}
            </p>
            {editingKey === key ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(key);
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  className="h-8 text-sm"
                  autoFocus
                  disabled={disabled}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSaveEdit(key)}
                  disabled={disabled}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-900">{value}</p>
            )}
          </div>
          {editingKey !== key && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEdit(key)}
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
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
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
                      placeholder="e.g., Serial Number"
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
                placeholder="e.g., Serial Number"
                className="h-8 text-sm"
                disabled={disabled}
              />
            )}
            <p className="text-xs text-gray-500">
              Will be stored as: {formatKeyForStorage(newKey || "property_name")}
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-value" className="text-xs">
              Value
            </Label>
            <Input
              id="new-value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Enter value"
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") {
                  setIsAdding(false);
                  setNewKey("");
                  setNewValue("");
                }
              }}
              disabled={disabled}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} size="sm" disabled={disabled}>
              <Check className="h-4 w-4 mr-1" />
              Add
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewKey("");
                setNewValue("");
                setSuggestionsOpen(false);
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
