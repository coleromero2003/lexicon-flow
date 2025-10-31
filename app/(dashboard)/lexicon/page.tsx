"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrganization, useUser } from "@clerk/nextjs";
import { BookOpen, Filter, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import type { SupabaseClient } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { NoOrganizationState } from "@/components/ui/no-organization-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { lexiconService } from "@/lib/services";
import type { LexiconItem, LexiconType } from "@/lib/supabase/models";

const LEXICON_TYPE_LABELS: Record<LexiconType, string> = {
  part: "Part",
  workflow_template: "Workflow Template",
  step_template: "Step Template",
  document: "Document",
  spec: "Specification",
  client: "Client",
};

const LEXICON_TYPES: LexiconType[] = [
  "part",
  "workflow_template",
  "step_template",
  "document",
  "spec",
  "client",
];

type FormState = {
  name: string;
  type: LexiconType;
  notes: string;
  version: number;
};

const defaultType: LexiconType = "part";

const createInitialFormState = (): FormState => ({
  name: "",
  type: defaultType,
  notes: "",
  version: 1,
});

export default function LexiconPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded: userLoaded } = useUser();
  const { organization } = useOrganization();
  const { supabase } = useSupabase();

  const [lexiconItems, setLexiconItems] = useState<LexiconItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<LexiconType | "all">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<FormState>(() => createInitialFormState());

  useEffect(() => {
    if (userLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isSignedIn, userLoaded, router]);

  useEffect(() => {
    if (!supabase || !organization?.id) {
      return;
    }

    let isMounted = true;

    const orgId = organization.id;

    async function loadLexicon(client: SupabaseClient, organizationId: string) {
      try {
        setLoading(true);
        setError(null);
        const items = await lexiconService.getLexiconItemsForOrg(
          client,
          organizationId
        );
        if (!isMounted) return;
        setLexiconItems(items);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load lexicon items.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadLexicon(supabase, orgId);

    return () => {
      isMounted = false;
    };
  }, [supabase, organization]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const typeCounts = useMemo(() => {
    const counts: Record<LexiconType, number> = {
      part: 0,
      workflow_template: 0,
      step_template: 0,
      document: 0,
      spec: 0,
      client: 0,
    };

    lexiconItems.forEach((item) => {
      counts[item.type] += 1;
    });

    return counts;
  }, [lexiconItems]);

  const filteredItems = useMemo(() => {
    return lexiconItems.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = `${item.name}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [lexiconItems, normalizedQuery, typeFilter]);

  const hasFilters = normalizedQuery.length > 0 || typeFilter !== "all";

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setFormState(createInitialFormState());
      setIsSubmitting(false);
    }
  };

  const handleCreateLexiconItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      toast.error("Supabase client not initialized");
      return;
    }

    if (!organization) {
      toast.error("Select an organization to create lexicon items");
      return;
    }

    if (!formState.name.trim()) {
      toast.error("A name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const attributes = formState.notes.trim()
        ? { notes: formState.notes.trim() }
        : {};

      const newItem = await lexiconService.createLexiconItem(supabase, {
        org_id: organization.id,
        type: formState.type,
        name: formState.name.trim(),
        attributes,
        version: Number.isNaN(formState.version) ? 1 : formState.version,
      });

      setLexiconItems((prev) =>
        [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success("Lexicon item created");
      handleDialogOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create lexicon item.";
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  if (!userLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner label="Loading your account..." />
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  if (!organization) {
    return <NoOrganizationState />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto space-y-6 px-4 py-6 sm:py-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Lexicon for {organization.name}
              </h1>
              <p className="text-gray-600">
                Manage reusable templates, parts, documents, and specs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={typeFilter}
                onValueChange={(value) =>
                  setTypeFilter(value as LexiconType | "all")
                }
              >
                <SelectTrigger size="sm" className="min-w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {LEXICON_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {LEXICON_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateLexiconItem} className="space-y-4">
                    <DialogHeader>
                      <DialogTitle>Create lexicon item</DialogTitle>
                      <DialogDescription>
                        Define a reusable asset that can be linked across projects.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                      <Label htmlFor="lexicon-name">Name</Label>
                      <Input
                        id="lexicon-name"
                        value={formState.name}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                        placeholder="e.g. Allen-Bradley PLC-5"
                        required
                        autoFocus
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={formState.type}
                        onValueChange={(value) =>
                          setFormState((prev) => ({
                            ...prev,
                            type: value as LexiconType,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                        <SelectContent>
                          {LEXICON_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {LEXICON_TYPE_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lexicon-notes">Notes</Label>
                      <Textarea
                        id="lexicon-notes"
                        value={formState.notes}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            notes: event.target.value,
                          }))
                        }
                        placeholder="Add key specs, revision notes, or sourcing details"
                      />
                    </div>

                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create item"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, manufacturer, or SKU"
                className="pl-9"
              />
            </div>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {lexiconItems.length}
                  </p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-600">Parts</p>
              <p className="text-2xl font-bold text-gray-900">{typeCounts.part}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-600">
                Workflow Templates
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {typeCounts.workflow_template}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-600">Step Templates</p>
              <p className="text-2xl font-bold text-gray-900">
                {typeCounts.step_template}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-600">Documents</p>
              <p className="text-2xl font-bold text-gray-900">
                {typeCounts.document}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-600">Specifications</p>
              <p className="text-2xl font-bold text-gray-900">{typeCounts.spec}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-600">Clients</p>
              <p className="text-2xl font-bold text-gray-900">{typeCounts.client}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          {error ? (
            <Card>
              <CardContent className="py-12 text-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Failed to load lexicon items
                </h2>
                <p className="mt-2 text-sm text-gray-600">{error}</p>
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent>
                <EmptyState
                  icon={<BookOpen className="h-10 w-10" />}
                  title={hasFilters ? "No lexicon items match your filters" : "No lexicon items yet"}
                  description={
                    hasFilters
                      ? "Try adjusting your search or filter selections."
                      : "Create your first entry to start building a reusable knowledge base."
                  }
                  action={
                    <Button onClick={() => handleDialogOpenChange(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Create lexicon item
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => {
                const notes =
                  typeof item.attributes?.notes === "string"
                    ? item.attributes.notes
                    : undefined;

                return (
                  <Link key={item.id} href={`/lexicon/${item.id}`}>
                    <Card className="transition-all hover:shadow-md cursor-pointer">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-base text-gray-900">
                              {item.name}
                            </CardTitle>
                            <CardDescription>
                              {LEXICON_TYPE_LABELS[item.type]}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary">
                            Version {item.version}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {notes && (
                          <p className="line-clamp-2 text-sm text-gray-600">
                            {notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

