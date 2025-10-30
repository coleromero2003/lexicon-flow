"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, User, XCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface OrganizationUserOption {
  userId: string;
  name: string;
  email?: string;
}

// Single-select props
export interface OrganizationUserComboboxSingleProps {
  users: OrganizationUserOption[];
  value: string | null;
  onChange: (userId: string | null) => void;
  multiple?: false;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  loadingText?: string;
  allowClear?: boolean;
  clearLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

// Multi-select props
export interface OrganizationUserComboboxMultiProps {
  users: OrganizationUserOption[];
  value: string[];
  onChange: (userIds: string[]) => void;
  multiple: true;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  loadingText?: string;
  allowClear?: boolean;
  clearLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export type OrganizationUserComboboxProps =
  | OrganizationUserComboboxSingleProps
  | OrganizationUserComboboxMultiProps;

export function OrganizationUserCombobox(props: OrganizationUserComboboxProps) {
  const {
    users,
    value,
    onChange,
    placeholder = "Select person...",
    searchPlaceholder = "Search people...",
    emptyText = "No people found.",
    loadingText = "Loading organization members...",
    allowClear = true,
    clearLabel = "Clear selection",
    loading = false,
    disabled = false,
    className,
  } = props;

  const multiple = "multiple" in props && props.multiple === true;
  const [open, setOpen] = useState(false);

  // For single-select mode
  const selectedUser = useMemo(
    () => !multiple && value ? users.find((user) => user.userId === value) ?? null : null,
    [users, value, multiple]
  );

  // For multi-select mode
  const selectedUsers = useMemo(
    () => multiple && Array.isArray(value) ? users.filter((user) => value.includes(user.userId)) : [],
    [users, value, multiple]
  );

  const showLoadingState = loading && users.length === 0;

  // Handler for multi-select
  const handleMultiSelectToggle = (userId: string) => {
    if (!multiple || !Array.isArray(value)) return;

    const newValue = value.includes(userId)
      ? value.filter((id) => id !== userId)
      : [...value, userId];

    (onChange as (userIds: string[]) => void)(newValue);
  };

  // Handler for single-select
  const handleSingleSelect = (userId: string) => {
    if (multiple) return;
    (onChange as (userId: string | null) => void)(userId);
    setOpen(false);
  };

  // Handler for clearing selection
  const handleClear = () => {
    if (multiple) {
      (onChange as (userIds: string[]) => void)([]);
    } else {
      (onChange as (userId: string | null) => void)(null);
    }
    setOpen(false);
  };

  // Handler for removing a specific user in multi-select mode
  const handleRemoveUser = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!multiple || !Array.isArray(value)) return;
    const newValue = value.filter((id) => id !== userId);
    (onChange as (userIds: string[]) => void)(newValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", multiple && selectedUsers.length > 0 ? "h-auto min-h-10 py-2" : "", className)}
        >
          <span className="flex flex-1 items-center gap-2 overflow-hidden text-left">
            {multiple ? (
              selectedUsers.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedUsers.map((user) => (
                    <Badge key={user.userId} variant="secondary" className="gap-1">
                      {user.name}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleRemoveUser(user.userId, e)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleRemoveUser(user.userId, e as unknown as React.MouseEvent);
                          }
                        }}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-sm cursor-pointer"
                        aria-label={`Remove ${user.name}`}
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="truncate text-muted-foreground">{placeholder}</span>
              )
            ) : (
              <span className="truncate">
                {selectedUser ? selectedUser.name : placeholder}
              </span>
            )}
          </span>
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <User className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0">
        {showLoadingState ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {loadingText}
          </div>
        ) : (
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              {allowClear && ((multiple && Array.isArray(value) && value.length > 0) || (!multiple && value)) && (
                <>
                  <CommandGroup>
                    <CommandItem
                      value="__clear"
                      onSelect={handleClear}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      {clearLabel}
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}
              {users.length > 0 && (
                <CommandGroup heading="Members">
                  {users.map((user) => {
                    const isSelected = multiple
                      ? Array.isArray(value) && value.includes(user.userId)
                      : currentValueMatches(value as string | null, user.userId);

                    return (
                      <CommandItem
                        key={user.userId}
                        value={user.userId}
                        onSelect={(currentValue) => {
                          if (multiple) {
                            handleMultiSelectToggle(currentValue);
                          } else {
                            handleSingleSelect(currentValue);
                          }
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col overflow-hidden">
                          <span className="truncate">{user.name}</span>
                          {user.email && (
                            <span className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}

function currentValueMatches(
  selected: string | null,
  candidate: string
): boolean {
  if (!selected) {
    return false;
  }

  return selected === candidate;
}
