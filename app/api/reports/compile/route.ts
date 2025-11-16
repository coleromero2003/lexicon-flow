import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument } from "pdf-lib";
import {
  objectService,
  objectFileService,
  objectLexiconService,
  lexiconFileService,
  lexiconService,
} from "@/lib/services";

interface PDFSource {
  filename: string;
  storageKey: string;
  source: "object" | "lexicon";
  lexiconName?: string;
}

// PDF Layout Constants
const FIRST_CONTENT_PAGE = 3; // Page number where content starts (after title and TOC)
const MAX_DESCRIPTION_LINES = 30; // Maximum lines to display on title page
const PAGE_BOTTOM_MARGIN = 50; // Minimum y-position before page overflow

export async function POST(req: NextRequest) {
  try {
    // Authenticate with Clerk
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { objectId } = body;

    if (!objectId || typeof objectId !== "number") {
      return NextResponse.json(
        { error: "objectId is required and must be a number" },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          "x-org-id": orgId || "",
        },
      },
    });

    // Fetch object data
    const object = await objectService.getObject(supabase, objectId);

    if (!object) {
      return NextResponse.json({ error: "Object not found" }, { status: 404 });
    }

    // Gather all PDF files from object
    const objectFiles = await objectFileService.getFilesForObject(
      supabase,
      objectId
    );
    const objectPdfs: PDFSource[] = objectFiles
      .filter((file) => file.mime_type === "application/pdf")
      .map((file) => ({
        filename: file.filename,
        storageKey: file.storage_key,
        source: "object" as const,
      }));

    // Gather all linked lexicon items and their PDFs
    const lexiconLinks = await objectLexiconService.getLexiconByObject(
      supabase,
      objectId
    );

    const lexiconPdfs: PDFSource[] = [];

    for (const link of lexiconLinks) {
      // Fetch lexicon item to get name using service layer
      let lexiconItem;
      try {
        lexiconItem = await lexiconService.getLexiconItem(
          supabase,
          link.lexicon_id
        );
      } catch (error) {
        console.error(
          `Failed to fetch lexicon item ${link.lexicon_id}:`,
          error
        );
        continue; // Skip this lexicon item if we can't fetch it
      }

      // Fetch files for this lexicon item
      const lexiconFiles = await lexiconFileService.getFilesForLexicon(
        supabase,
        link.lexicon_id
      );

      const pdfs = lexiconFiles
        .filter((file) => file.mime_type === "application/pdf")
        .map((file) => ({
          filename: file.filename,
          storageKey: file.storage_key,
          source: "lexicon" as const,
          lexiconName: lexiconItem.name,
        }));

      lexiconPdfs.push(...pdfs);
    }

    const allPdfs = [...objectPdfs, ...lexiconPdfs];

    if (allPdfs.length === 0) {
      return NextResponse.json(
        {
          error:
            "No PDF files found for this object or its linked lexicon items",
        },
        { status: 400 }
      );
    }

    // Create the merged PDF document
    const mergedPdf = await PDFDocument.create();

    // Add title page with object description (markdown)
    await addTitlePage(mergedPdf, object.title, object.description_md || "");

    // Add table of contents page
    let currentPageNumber = FIRST_CONTENT_PAGE;
    const tocEntries: { title: string; page: number; source: string }[] = [];

    // Cache PDFs to avoid downloading twice (once for TOC, once for merging)
    const pdfCache = new Map<string, ArrayBuffer>();

    for (const pdf of allPdfs) {
      // Download the PDF from storage to get page count
      const { data: fileData } = await supabase.storage
        .from("lexicon-files")
        .download(pdf.storageKey);

      if (!fileData) continue;

      const pdfBytes = await fileData.arrayBuffer();
      pdfCache.set(pdf.storageKey, pdfBytes); // Cache for later use

      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pageCount = pdfDoc.getPageCount();

      const sourceLabel =
        pdf.source === "object"
          ? "Object File"
          : `Lexicon: ${pdf.lexiconName}`;

      tocEntries.push({
        title: pdf.filename,
        page: currentPageNumber,
        source: sourceLabel,
      });

      currentPageNumber += pageCount;
    }

    await addTableOfContents(mergedPdf, tocEntries);

    // Track page indices for bookmarks
    const bookmarkData: { title: string; pageIndex: number }[] = [];

    // Add bookmark for title page
    bookmarkData.push({ title: "Title Page", pageIndex: 0 });

    // Add bookmark for table of contents
    bookmarkData.push({ title: "Table of Contents", pageIndex: 1 });

    // Download and merge all PDFs
    let currentPageIndex = 2; // Start after title and TOC pages
    for (const pdf of allPdfs) {
      // Use cached PDF bytes instead of downloading again
      const cachedBytes = pdfCache.get(pdf.storageKey);

      if (!cachedBytes) {
        console.error(`PDF not found in cache: ${pdf.filename}`);
        continue;
      }

      try {
        const pdfDoc = await PDFDocument.load(cachedBytes);
        const pageCount = pdfDoc.getPageCount();
        const pages = await mergedPdf.copyPages(
          pdfDoc,
          Array.from({ length: pageCount }, (_, j) => j)
        );

        // Add bookmark for this PDF
        const sourceLabel =
          pdf.source === "object"
            ? `${pdf.filename}`
            : `${pdf.lexiconName} - ${pdf.filename}`;
        bookmarkData.push({
          title: sourceLabel,
          pageIndex: currentPageIndex,
        });

        pages.forEach((page) => {
          mergedPdf.addPage(page);
        });

        currentPageIndex += pageCount;
      } catch (error) {
        console.error(`Error merging PDF ${pdf.filename}:`, error);
        // Continue with other PDFs instead of failing completely
      }
    }

    // Add bookmarks/outlines to the PDF
    await addBookmarks(mergedPdf, bookmarkData);

    // Save merged PDF
    const mergedPdfBytes = await mergedPdf.save();

    // Generate filename
    const filename = `compiled-${object.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;

    // Return merged PDF as download
    return new NextResponse(mergedPdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": mergedPdfBytes.length.toString(),
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Error compiling PDFs:", error);
    return NextResponse.json(
      {
        error: "Failed to compile PDFs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Add a title page with the object title and description markdown
 */
async function addTitlePage(
  pdfDoc: PDFDocument,
  title: string,
  descriptionMd: string
) {
  // Type assertion needed: PDFPage type definition doesn't include all methods available at runtime
  // This is safe because addPage() returns a valid PDFPage object with drawing methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const page = pdfDoc.addPage([612, 792]) as any; // US Letter size
  const { width, height } = page.getSize();

  // Type assertion needed: embedFont() exists at runtime but is not in pdf-lib's TypeScript definitions
  // Safe because Helvetica fonts are built into PDF standard and always available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const font = await (pdfDoc as any).embedFont('Helvetica');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boldFont = await (pdfDoc as any).embedFont('Helvetica-Bold');

  // Draw title
  const titleFontSize = 24;
  const titleWidth = boldFont.widthOfTextAtSize(title, titleFontSize);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: height - 100,
    size: titleFontSize,
    font: boldFont,
  });

  // Draw description label
  page.drawText("Description", {
    x: 50,
    y: height - 160,
    size: 14,
    font: boldFont,
  });

  // Draw description (simplified - just raw text without markdown formatting)
  // For a production system, you'd want to parse markdown and render it properly
  const descriptionLines = wrapText(
    descriptionMd || "No description provided.",
    font,
    12,
    width - 100
  );

  let yPosition = height - 190;
  for (const line of descriptionLines.slice(0, MAX_DESCRIPTION_LINES)) {
    page.drawText(line, {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
    });
    yPosition -= 18;

    if (yPosition < PAGE_BOTTOM_MARGIN) break; // Don't overflow the page
  }

  // Add footer
  page.drawText(`Compiled from Lexicon Flow`, {
    x: 50,
    y: 30,
    size: 10,
    font: font,
  });
}

/**
 * Add a table of contents page
 */
async function addTableOfContents(
  pdfDoc: PDFDocument,
  entries: { title: string; page: number; source: string }[]
) {
  // Type assertion needed: PDFPage type definition doesn't include all methods available at runtime
  // This is safe because addPage() returns a valid PDFPage object with drawing methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const page = pdfDoc.addPage([612, 792]) as any; // US Letter size
  const { width, height } = page.getSize();

  // Type assertion needed: embedFont() exists at runtime but is not in pdf-lib's TypeScript definitions
  // Safe because Helvetica fonts are built into PDF standard and always available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const font = await (pdfDoc as any).embedFont('Helvetica');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boldFont = await (pdfDoc as any).embedFont('Helvetica-Bold');

  // Draw title
  const tocTitle = "Table of Contents";
  const titleFontSize = 20;
  const titleWidth = boldFont.widthOfTextAtSize(tocTitle, titleFontSize);
  page.drawText(tocTitle, {
    x: (width - titleWidth) / 2,
    y: height - 60,
    size: titleFontSize,
    font: boldFont,
  });

  // Draw entries
  let yPosition = height - 100;
  const lineHeight = 20;

  for (const entry of entries) {
    if (yPosition < PAGE_BOTTOM_MARGIN) break; // Don't overflow the page

    // Draw filename
    const truncatedTitle =
      entry.title.length > 50
        ? entry.title.substring(0, 47) + "..."
        : entry.title;
    page.drawText(truncatedTitle, {
      x: 50,
      y: yPosition,
      size: 11,
      font: font,
    });

    // Draw source in smaller text
    page.drawText(entry.source, {
      x: 50,
      y: yPosition - 12,
      size: 9,
      font: font,
    });

    // Draw page number
    const pageText = `Page ${entry.page}`;
    const pageWidth = font.widthOfTextAtSize(pageText, 11);
    page.drawText(pageText, {
      x: width - 50 - pageWidth,
      y: yPosition,
      size: 11,
      font: font,
    });

    yPosition -= lineHeight + 12;
  }
}

/**
 * Wrap text to fit within a given width
 */
function wrapText(
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  font: any,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Add PDF bookmarks/outlines for navigation
 */
async function addBookmarks(
  pdfDoc: PDFDocument,
  bookmarks: { title: string; pageIndex: number }[]
) {
  // Type assertions needed: Accessing pdf-lib's low-level API for bookmark/outline creation
  // The context and catalog properties exist at runtime but are not exposed in TypeScript types
  // This is safe because we're using documented pdf-lib internal APIs for advanced features
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context = (pdfDoc as any).context;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catalog = (pdfDoc as any).catalog;

  // Create outline dictionary
  const outlineRef = context.nextRef();
  const outlineDict = context.obj({
    Type: "Outlines",
    Count: bookmarks.length,
  });

  // Pre-allocate all outline item refs
  const outlineItemRefs = bookmarks.map(() => context.nextRef());

  // Type assertion needed: getPages() is not in public TypeScript API but exists at runtime
  // Safe because we're working with the internal page array for bookmark destination references
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pages = (pdfDoc as any).getPages();

  // Create outline items
  const outlineItemDicts = bookmarks.map((bookmark, i) => {
    const page = pages[bookmark.pageIndex];
    // Type assertion needed: Access internal page reference for PDF destination linking
    // Safe because every PDFPage object has a ref property for internal PDF object references
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageRef = (page as any).ref;

    return context.obj({
      Title: context.obj(bookmark.title),
      Parent: outlineRef,
      Prev: i > 0 ? outlineItemRefs[i - 1] : undefined,
      Next: i < bookmarks.length - 1 ? outlineItemRefs[i + 1] : undefined,
      Dest: [pageRef, "XYZ", null, null, null],
    });
  });

  // Update outline dictionary with first and last items
  if (outlineItemRefs.length > 0) {
    outlineDict.set(
      context.obj("First"),
      outlineItemRefs[0]
    );
    outlineDict.set(
      context.obj("Last"),
      outlineItemRefs[outlineItemRefs.length - 1]
    );
  }

  // Register outline and items in context
  context.assign(outlineRef, outlineDict);
  outlineItemRefs.forEach((ref, i) => {
    context.assign(ref, outlineItemDicts[i]);
  });

  // Add outline to catalog
  catalog.set(context.obj("Outlines"), outlineRef);
}

// Add OPTIONS handler for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
