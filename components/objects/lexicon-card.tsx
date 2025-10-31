"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Package, Plus, Trash2, Download } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LexiconLinkInfo {
  link: {
    lexicon_id: number;
    note: string | null;
  };
  lexiconItem: {
    name: string;
    type: string;
    attributes?: Record<string, unknown>;
  };
}

interface LexiconCardProps {
  lexiconLinks: LexiconLinkInfo[];
  onAdd?: () => void;
  onUnlink: (lexiconId: number) => Promise<void>;
  onInheritProperties?: (lexiconId: number, attributes: Record<string, unknown>) => Promise<void>;
  onNavigate?: (lexiconId: number) => void;
}

export function LexiconCard({
  lexiconLinks,
  onAdd,
  onUnlink,
  onInheritProperties,
  onNavigate,
}: LexiconCardProps) {
  const hasInheritableProps = (attributes?: Record<string, unknown>) =>
    attributes && Object.keys(attributes).length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lexicon Items
          </CardTitle>
          <CardDescription>Linked components</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {lexiconLinks.length === 0 ? (
          <EmptyState
            icon={<Package className="h-8 w-8" />}
            title="No lexicon items"
            description="Link parts, specs, or documents from your lexicon."
          />
        ) : (
          <div className="space-y-2">
            {lexiconLinks.map(({ link, lexiconItem }) => (
              <div
                key={link.lexicon_id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`flex-1 min-w-0 ${onNavigate ? 'cursor-pointer' : ''}`}
                    onClick={() => onNavigate?.(link.lexicon_id)}
                  >
                    <p className="text-sm font-medium text-gray-900 mb-1 hover:text-blue-600">
                      {lexiconItem.name}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {lexiconItem.type.replace(/_/g, " ")}
                      </Badge>
                      {hasInheritableProps(lexiconItem.attributes) && (
                        <Badge variant="secondary" className="text-xs">
                          {Object.keys(lexiconItem.attributes || {}).length} properties
                        </Badge>
                      )}
                    </div>
                    {link.note && (
                      <p className="text-xs text-gray-600 mt-1">{link.note}</p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {onInheritProperties && hasInheritableProps(lexiconItem.attributes) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                onInheritProperties(
                                  link.lexicon_id,
                                  lexiconItem.attributes || {}
                                )
                              }
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Inherit {Object.keys(lexiconItem.attributes || {}).length} properties to object properties</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onUnlink(link.lexicon_id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
