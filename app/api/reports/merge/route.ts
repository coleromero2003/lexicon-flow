import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument } from "pdf-lib";
import { fileService } from "@/lib/services";

export async function POST(req: NextRequest) {
  try {
    // Authenticate with Clerk
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { fileIds } = body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: "fileIds array is required and must not be empty" },
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

    // Fetch file metadata
    const fileMetadataList = await Promise.all(
      fileIds.map((id) => fileService.getFile(supabase, id))
    );

    // Filter for PDF files only
    const pdfFiles = fileMetadataList.filter(
      (file) => file.mime_type === "application/pdf"
    );

    if (pdfFiles.length === 0) {
      return NextResponse.json(
        { error: "No PDF files found to merge" },
        { status: 400 }
      );
    }

    // Download PDFs from Supabase Storage
    const pdfBuffers = await Promise.all(
      pdfFiles.map(async (file) => {
        const { data, error } = await supabase.storage
          .from("lexicon-files")
          .download(file.storage_key);

        if (error || !data) {
          throw new Error(`Failed to download file: ${file.filename}`);
        }

        return await data.arrayBuffer();
      })
    );

    // Merge PDFs using pdf-lib
    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < pdfBuffers.length; i++) {
      try {
        const pdfDoc = await PDFDocument.load(pdfBuffers[i]);
        const pageCount = pdfDoc.getPageCount();
        const pages = await mergedPdf.copyPages(pdfDoc, Array.from({ length: pageCount }, (_, j) => j));

        pages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      } catch (error) {
        console.error(`Error merging PDF ${pdfFiles[i].filename}:`, error);
        // Continue with other PDFs instead of failing completely
      }
    }

    // Save merged PDF
    const mergedPdfBytes = Buffer.from(await mergedPdf.save());

    // Generate filename
    const timestamp = Date.now();
    const filename = `merged-report-${timestamp}.pdf`;

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
    console.error("Error merging PDFs:", error);
    return NextResponse.json(
      {
        error: "Failed to merge PDFs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
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
