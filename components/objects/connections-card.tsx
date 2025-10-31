"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Link2, Plus, Trash2 } from "lucide-react";

interface RelationInfo {
  relation: {
    id: number;
    relation_kind: string;
  };
  relatedObject: {
    id: number;
    title: string;
  };
}

interface ConnectionsCardProps {
  relations: RelationInfo[];
  onAdd?: () => void;
  onDelete: (relationId: number) => Promise<void>;
  onNavigate: (objectId: number) => void;
}

export function ConnectionsCard({
  relations,
  onAdd,
  onDelete,
  onNavigate,
}: ConnectionsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Connections
          </CardTitle>
          <CardDescription>Related objects</CardDescription>
        </div>
        <Button data-testid="add-relationship-btn" size="sm" variant="outline" onClick={onAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {relations.length === 0 ? (
          <EmptyState
            icon={<Link2 className="h-8 w-8" />}
            title="No connections"
            description="Link this object to related objects in your project."
          />
        ) : (
          <div className="space-y-2">
            {relations.map(({ relation, relatedObject }) => (
              <div
                data-testid="relationship-item"
                key={relation.id}
                onClick={() => onNavigate(relatedObject.id)}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {relatedObject.title}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {relation.relation_kind.replace(/_/g, " ")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(relation.id);
                    }}
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
