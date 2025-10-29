import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { renderToBuffer } from "@react-pdf/renderer";
import { PurchaseReportDocument } from "@/components/reports/PurchaseReportDocument";
import {
  objectService,
  objectLexiconService,
  lexiconService,
  projectService,
} from "@/lib/services";
import React from "react";

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

    // Create Supabase client with user's JWT
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Get the session token from Clerk to authenticate with Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          // Pass organization ID for RLS
          "x-org-id": orgId || "",
        },
      },
    });

    // Fetch object data
    const object = await objectService.getObject(supabase, objectId);

    if (!object) {
      return NextResponse.json({ error: "Object not found" }, { status: 404 });
    }

    // Fetch linked lexicon items
    const lexiconLinks = await objectLexiconService.getLexiconByObject(
      supabase,
      objectId
    );

    const lexiconItemsWithDetails = await Promise.all(
      lexiconLinks.map(async (link) => {
        const item = await lexiconService.getLexiconItem(supabase, link.lexicon_id);
        return {
          link,
          item,
        };
      })
    );

    // Fetch project name if available
    let projectName: string | undefined;
    try {
      const project = await projectService.getProjectById(
        supabase,
        object.project_id
      );
      projectName = project?.name;
    } catch {
      // Project name is optional
      projectName = undefined;
    }

    // Generate PDF
    const pdfDoc = React.createElement(PurchaseReportDocument, {
      object,
      lexiconItems: lexiconItemsWithDetails,
      projectName,
      organizationName: orgId ? `Organization ${orgId}` : undefined,
    });

    // Render to buffer
    const pdfBuffer = await renderToBuffer(pdfDoc);

    // Return PDF as download
    const filename = `purchase-report-${object.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Error generating purchase report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
