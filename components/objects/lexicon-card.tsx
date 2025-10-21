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
import { Package, Plus, Trash2 } from "lucide-react";

interface LexiconLinkInfo {
  link: {
    lexicon_id: number;
    note: string | null;
  };
  lexiconItem: {
    name: string;
    type: string;
    manufacturer: string | null;
  };
}

interface LexiconCardProps {
  lexiconLinks: LexiconLinkInfo[];
  onAdd?: () => void;
  onUnlink: (lexiconId: number) => Promise<void>;
}

export function LexiconCard({
  lexiconLinks,
  onAdd,
  onUnlink,
}: LexiconCardProps) {
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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {lexiconItem.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {lexiconItem.type.replace(/_/g, " ")}
                      </Badge>
                      {lexiconItem.manufacturer && (
                        <p className="text-xs text-gray-500">
                          {lexiconItem.manufacturer}
                        </p>
                      )}
                    </div>
                    {link.note && (
                      <p className="text-xs text-gray-600 mt-1">{link.note}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onUnlink(link.lexicon_id)}
                    className="opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
