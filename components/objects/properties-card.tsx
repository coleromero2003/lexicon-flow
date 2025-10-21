"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetadataEditor } from "@/components/metadata-editor";
import { Settings } from "lucide-react";

interface PropertiesCardProps {
  metadata: Record<string, unknown>;
  suggestions: string[];
  onUpdate: (newMetadata: Record<string, unknown>) => Promise<void>;
}

export function PropertiesCard({
  metadata,
  suggestions,
  onUpdate,
}: PropertiesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Properties
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MetadataEditor
          metadata={metadata}
          onUpdate={onUpdate}
          suggestions={suggestions}
        />
      </CardContent>
    </Card>
  );
}
