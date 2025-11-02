import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { renderToBuffer } from "@react-pdf/renderer";
import { submittalService } from "@/lib/services";
import { createSubmittalPDF } from "@/lib/pdf-generator";

export async function POST(req: NextRequest) {
  try {
    // Authenticate with Clerk
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { submittalObjectId, selectedObjectIds, specObjectId } = body;

    // Validate inputs
    if (!submittalObjectId || typeof submittalObjectId !== "number") {
      return NextResponse.json(
        { error: "submittalObjectId is required and must be a number" },
        { status: 400 }
      );
    }

    if (
      !selectedObjectIds ||
      !Array.isArray(selectedObjectIds) ||
      selectedObjectIds.length === 0
    ) {
      return NextResponse.json(
        { error: "selectedObjectIds is required and must be a non-empty array" },
        { status: 400 }
      );
    }

    if (
      specObjectId !== null &&
      specObjectId !== undefined &&
      typeof specObjectId !== "number"
    ) {
      return NextResponse.json(
        { error: "specObjectId must be a number or null" },
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

    // Aggregate submittal data
    const submittalData = await submittalService.aggregateSubmittalData(
      supabase,
      submittalObjectId,
      selectedObjectIds,
      specObjectId || null
    );

    // Generate PDF using React PDF
    const pdfBuffer = await renderToBuffer(createSubmittalPDF(submittalData));

    // Generate filename
    const filename = `submittal-${submittalData.submittalObject.title
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()}.pdf`;

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Error generating submittal PDF:", error);
    return NextResponse.json(
      {
        error: "Failed to generate submittal PDF",
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
