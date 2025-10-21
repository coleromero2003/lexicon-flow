"use client";

import "@mdxeditor/editor/style.css";
import dynamic from "next/dynamic";
import { forwardRef } from "react";
import type { MDXEditorMethods } from "@mdxeditor/editor";

// Import plugins and toolbar components
import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  tablePlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
} from "@mdxeditor/editor";

// Dynamically import MDXEditor with no SSR
const MDXEditor = dynamic(
  () => import("@mdxeditor/editor").then((mod) => mod.MDXEditor),
  { ssr: false }
);

interface MarkdownEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
}

export const MarkdownEditor = forwardRef<MDXEditorMethods, MarkdownEditorProps>(
  ({ markdown, onChange, placeholder, className }, ref) => {
    return (
      <div className={className || "border rounded-md overflow-hidden"}>
        <style jsx global>{`
          /* Ensure headings are styled in the editor */
          .mdxeditor-root-contenteditable h1 {
            font-size: 2em;
            font-weight: bold;
            margin-top: 0.67em;
            margin-bottom: 0.67em;
          }
          .mdxeditor-root-contenteditable h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin-top: 0.83em;
            margin-bottom: 0.83em;
          }
          .mdxeditor-root-contenteditable h3 {
            font-size: 1.17em;
            font-weight: bold;
            margin-top: 1em;
            margin-bottom: 1em;
          }
          .mdxeditor-root-contenteditable h4 {
            font-size: 1em;
            font-weight: bold;
            margin-top: 1.33em;
            margin-bottom: 1.33em;
          }
          .mdxeditor-root-contenteditable h5 {
            font-size: 0.83em;
            font-weight: bold;
            margin-top: 1.67em;
            margin-bottom: 1.67em;
          }
          .mdxeditor-root-contenteditable h6 {
            font-size: 0.67em;
            font-weight: bold;
            margin-top: 2.33em;
            margin-bottom: 2.33em;
          }
        `}</style>
        <MDXEditor
          ref={ref}
          markdown={markdown}
          onChange={onChange}
          placeholder={placeholder}
          contentEditableClassName="prose prose-sm max-w-none min-h-[200px] p-4"
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            tablePlugin(),
            markdownShortcutPlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  <BoldItalicUnderlineToggles />
                  <BlockTypeSelect />
                  <ListsToggle />
                  <CreateLink />
                  <InsertTable />
                  <InsertThematicBreak />
                </>
              ),
            }),
          ]}
        />
      </div>
    );
  }
);

MarkdownEditor.displayName = "MarkdownEditor";
