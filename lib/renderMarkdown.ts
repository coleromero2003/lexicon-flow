import fs from "node:fs/promises";
import path from "node:path";
import { remark } from "remark";
import html from "remark-html";

/**
 * Reads a Markdown file from /public/legal and returns rendered HTML.
 * If the file doesn't exist, it returns a small "not found" message.
 */
export async function renderLegalMarkdown(filename: string): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "public", "legal", filename);

    // Read markdown file from /public/legal
    const markdown = await fs.readFile(filePath, "utf8");

    // Convert Markdown → HTML using remark + remark-html
    const processed = await remark().use(html).process(markdown);
    return String(processed);
  } catch (err) {
    console.error(`⚠️ Error reading ${filename}:`, err);
    return `<h1>Document not found</h1><p>The requested legal document could not be loaded.</p>`;
  }
}
