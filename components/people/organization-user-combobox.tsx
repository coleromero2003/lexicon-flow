"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, User, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
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

export interface OrganizationUserComboboxProps {
  users: OrganizationUserOption[];
  value: string | null;
  onChange: (userId: string | null) => void;
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

export function OrganizationUserCombobox({
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
}: OrganizationUserComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedUser = useMemo(
    () => users.find((user) => user.userId === value) ?? null,
    [users, value]
  );

  const showLoadingState = loading && users.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          <span className="flex flex-1 items-center gap-2 overflow-hidden text-left">
            <span className="truncate">
              {selectedUser ? selectedUser.name : placeholder}
            </span>
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
              {allowClear && value && (
                <>
                  <CommandGroup>
                    <CommandItem
                      value="__clear"
                      onSelect={() => {
                        onChange(null);
                        setOpen(false);
                      }}
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
                  {users.map((user) => (
                    <CommandItem
                      key={user.userId}
                      value={user.userId}
                      onSelect={(currentValue) => {
                        onChange(currentValue);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          currentValueMatches(value, user.userId)
                            ? "opacity-100"
                            : "opacity-0"
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
                  ))}
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
