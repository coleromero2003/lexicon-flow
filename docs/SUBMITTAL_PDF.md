# Submittal PDF Generation

This document explains how to use the submittal and operations & maintenance manual PDF generation feature in Lexicon Flow.

## Overview

The submittal PDF generation feature allows users to create comprehensive submittal packages or operations & maintenance manuals from SCADA objects, their connected objects, files, and lexicon items. The generated PDF includes:

1. **Title Page** - Customizable with project and client information
2. **Table of Contents** - Auto-generated from all sections
3. **Specifications** - From a designated spec object
4. **Notes Page** - Custom notes and instructions
5. **Bill of Materials (BOM)** - Aggregated list of all parts with quantities
6. **Parts Sheets** - Detailed information and files for each part

## Architecture

### Service Layer

**File:** `lib/services.ts`

New service functions added:

- `submittalService.getConnectedObjects(supabase, objectId)` - Gets all objects connected via object_relations
- `submittalService.buildBillOfMaterials(supabase, objectIds)` - Aggregates lexicon items and calculates quantities
- `submittalService.getPartsSheets(supabase, objectIds)` - Gets lexicon items of type 'part' with their files
- `submittalService.aggregateSubmittalData(supabase, submittalObjectId, selectedObjectIds, specObjectId)` - Main aggregation function

### PDF Generation

**File:** `lib/pdf-generator.tsx`

Uses `@react-pdf/renderer` to generate PDFs with React components. Key features:

- Markdown parsing: Each heading (H1/H2/H3) becomes a new page
- Client information pulled from project's `client_lexicon_id`
- BOM table with automatic quantity aggregation
- Parts sheets with file references

**Function:** `createSubmittalPDF(data: SubmittalData)` - Returns a PDF Document element

### API Route

**File:** `app/api/submittal/pdf/route.ts`

POST endpoint that:
1. Authenticates with Clerk
2. Validates request (submittalObjectId, selectedObjectIds, specObjectId)
3. Creates authenticated Supabase client with org context
4. Aggregates data using submittalService
5. Generates PDF using @react-pdf/renderer
6. Returns PDF as downloadable file

**Endpoint:** `POST /api/submittal/pdf`

**Request Body:**
```json
{
  "submittalObjectId": 123,
  "selectedObjectIds": [1, 2, 3, 4],
  "specObjectId": 2  // or null
}
```

### UI Component

**File:** `components/objects/submittal-pdf-dialog.tsx`

Dialog component that:
- Loads all objects connected to the submittal object
- Provides checkboxes to select which objects to include
- Dropdown to select which object contains specifications
- "Select All" / "Deselect All" buttons for convenience
- Triggers API call and downloads generated PDF

## Usage

### 1. Create a Submittal Object

Create a SCADA object that will serve as the root of your submittal package. Add markdown content with different sections using headings:

```markdown
# Title Page
Project Name and Description
This is the main submittal for...

# Notes
Important notes for the reviewer:
- Item 1
- Item 2

# Installation Instructions
Steps for installation...
```

Each heading will become a separate page in the PDF.

### 2. Connect Related Objects

Use object relations to connect all relevant objects to the submittal object:
- Spec objects (containing specifications)
- Equipment objects (with part lexicon items)
- Any other related objects

### 3. Link Lexicon Items

Attach lexicon items (especially type: 'part') to the connected objects. These will appear in:
- Bill of Materials (with quantities)
- Parts Sheets (with attached files)

### 4. Set Client Information

Set the `client_lexicon_id` on the project to include client information on the title page.

### 5. Generate PDF

From the submittal object page:
1. Click "Generate PDF" button (to be added to UI)
2. In the dialog:
   - Review connected objects
   - Select/deselect objects to include
   - Choose which object contains specifications (optional)
3. Click "Generate PDF"
4. Download the generated submittal package

## Data Flow

```
Submittal Object
    ↓
Load Connected Objects (via object_relations)
    ↓
User Selects Objects & Spec
    ↓
API Aggregates:
  - Selected objects
  - Lexicon items linked to objects
  - Files linked to objects and lexicon items
  - Client info from project
    ↓
PDF Generator:
  - Parses markdown into pages
  - Generates TOC
  - Creates BOM with quantities
  - Includes parts sheets
    ↓
Download PDF
```

## Files Modified/Created

### New Files:
- `lib/pdf-generator.tsx` - PDF generation logic
- `app/api/submittal/pdf/route.ts` - API endpoint
- `components/objects/submittal-pdf-dialog.tsx` - UI dialog
- `docs/SUBMITTAL_PDF.md` - This documentation

### Modified Files:
- `lib/services.ts` - Added submittalService with helper functions

## Future Enhancements

Potential improvements:
1. **File Embedding** - Embed actual PDF files from parts sheets into the generated PDF
2. **Custom Templates** - Allow users to create custom PDF templates
3. **Cover Page Customization** - UI for designing custom cover pages
4. **Revision History** - Track versions of submitted packages
5. **Digital Signatures** - Support for digital signature fields
6. **Markdown Rendering** - Better markdown-to-PDF rendering with tables, images, etc.
7. **Progress Indicator** - Show progress during PDF generation
8. **Preview Mode** - Preview PDF before downloading

## Testing

To test the feature:
1. Create a test project with client information
2. Create a submittal object with markdown content
3. Create and connect several objects with lexicon items
4. Use the dialog to generate a PDF
5. Verify all sections appear correctly

## Troubleshooting

**PDF generation fails:**
- Check that all selected objects exist and are accessible
- Verify Clerk authentication is working
- Check browser console for errors
- Ensure Supabase connection is active

**Missing sections in PDF:**
- Verify markdown headings are formatted correctly
- Check that client_lexicon_id is set on project
- Ensure spec object is selected if needed

**BOM shows incorrect quantities:**
- Verify lexicon items are properly linked to objects
- Check that the same lexicon item is used across objects (not duplicates)

## Performance Considerations

- Large submittals (many objects/files) may take longer to generate
- PDF generation happens server-side to avoid client resource constraints
- Consider implementing pagination for very large BOMs
- File embedding (future) will significantly increase PDF size
