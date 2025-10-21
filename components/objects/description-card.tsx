"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownEditor } from "@/components/mdx-editor";

interface DescriptionCardProps {
  description: string;
  onChange: (newMarkdown: string) => void;
}

export function DescriptionCard({ description, onChange }: DescriptionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Description</CardTitle>
      </CardHeader>
      <CardContent>
        <MarkdownEditor
          markdown={description}
          onChange={onChange}
          placeholder="Enter object description using markdown..."
        />
      </CardContent>
    </Card>
  );
}
