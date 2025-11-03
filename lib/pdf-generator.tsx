import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { SubmittalData, BOMItem, PartSheet } from "./services";

// Register fonts (optional - uses default Helvetica if not registered)
// Font.register({
//   family: 'Open Sans',
//   src: 'https://fonts.gstatic.com/s/opensans/v17/mem8YaGs126MiZpBA-UFVZ0e.ttf'
// });

// Styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  titlePage: {
    padding: 40,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  heading1: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 15,
  },
  heading2: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },
  heading3: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 8,
  },
  paragraph: {
    marginBottom: 10,
    lineHeight: 1.5,
    textAlign: "justify",
  },
  tocItem: {
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tocText: {
    fontSize: 12,
  },
  tocPage: {
    fontSize: 12,
  },
  table: {
    display: "flex",
    width: "auto",
    marginTop: 15,
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    minHeight: 30,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
    borderBottomWidth: 2,
    borderBottomColor: "#666",
  },
  tableCol: {
    padding: 8,
    fontSize: 10,
  },
  tableColName: {
    width: "40%",
  },
  tableColQty: {
    width: "20%",
  },
  tableColType: {
    width: "20%",
  },
  tableColDesc: {
    width: "20%",
  },
  pageNumber: {
    position: "absolute",
    fontSize: 10,
    bottom: 20,
    right: 40,
    color: "gray",
  },
  clientInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
  },
  clientInfoText: {
    fontSize: 12,
    marginBottom: 5,
  },
});

// Parse markdown into sections (each H1/H2 heading = new section)
interface MarkdownSection {
  heading: string;
  content: string;
  level: number;
}

function parseMarkdownSections(markdown: string | null): MarkdownSection[] {
  if (!markdown) return [];

  const lines = markdown.split("\n");
  const sections: MarkdownSection[] = [];
  let currentSection: MarkdownSection | null = null;

  for (const line of lines) {
    // Check for headings
    const h1Match = line.match(/^#\s+(.+)$/);
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h1Match || h2Match || h3Match) {
      // Save previous section if exists
      if (currentSection) {
        sections.push(currentSection);
      }

      // Start new section
      const heading = h1Match
        ? h1Match[1]
        : h2Match
        ? h2Match[1]
        : h3Match![1];
      const level = h1Match ? 1 : h2Match ? 2 : 3;

      currentSection = {
        heading,
        content: "",
        level,
      };
    } else if (currentSection) {
      // Add content to current section
      currentSection.content += line + "\n";
    }
  }

  // Add the last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

// Format client info from lexicon attributes
function formatClientInfo(clientInfo: SubmittalData["clientInfo"]): string[] {
  if (!clientInfo) return [];

  const attrs = clientInfo.attributes as Record<string, unknown>;
  const info: string[] = [];

  if (attrs.name) info.push(`Client: ${attrs.name}`);
  if (attrs.contact) info.push(`Contact: ${attrs.contact}`);
  if (attrs.email) info.push(`Email: ${attrs.email}`);
  if (attrs.phone) info.push(`Phone: ${attrs.phone}`);
  if (attrs.address) info.push(`Address: ${attrs.address}`);

  return info;
}

// Title Page Component
const TitlePage: React.FC<{
  data: SubmittalData;
  titleSection: MarkdownSection | null;
}> = ({ data, titleSection }) => {
  const clientInfoLines = formatClientInfo(data.clientInfo);

  return (
    <Page size="A4" style={styles.titlePage}>
      <Text style={styles.title}>
        {titleSection?.heading || data.project.name}
      </Text>
      <Text style={styles.subtitle}>
        {data.submittalObject.title || "Submittal Package"}
      </Text>

      {titleSection?.content && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.paragraph}>{titleSection.content.trim()}</Text>
        </View>
      )}

      {clientInfoLines.length > 0 && (
        <View style={styles.clientInfo}>
          {clientInfoLines.map((line, idx) => (
            <Text key={idx} style={styles.clientInfoText}>
              {line}
            </Text>
          ))}
        </View>
      )}

      <Text
        style={styles.pageNumber}
        // @ts-expect-error - render prop is valid but not in types
        render={({ pageNumber }: { pageNumber: number }) => `${pageNumber}`}
        fixed
      />
    </Page>
  );
};

// Table of Contents Component
const TableOfContents: React.FC<{ sections: MarkdownSection[] }> = ({
  sections,
}) => {
  // Filter out title page if it exists
  const tocSections = sections.filter(
    (s) => !s.heading.toLowerCase().includes("title")
  );

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.heading1}>Table of Contents</Text>

      {tocSections.map((section, idx) => (
        <View key={idx} style={styles.tocItem}>
          <Text style={styles.tocText}>{section.heading}</Text>
          <Text style={styles.tocPage}>{idx + 3}</Text>
        </View>
      ))}

      <Text
        style={styles.pageNumber}
        // @ts-expect-error - render prop is valid but not in types
        render={({ pageNumber }: { pageNumber: number }) => `${pageNumber}`}
        fixed
      />
    </Page>
  );
};

// Specifications Page Component
const SpecificationsPage: React.FC<{ specObject: SubmittalData["specObject"] }> = ({
  specObject,
}) => {
  if (!specObject) return null;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.heading1}>Specifications</Text>
      <Text style={styles.heading2}>{specObject.title}</Text>

      {specObject.description_md && (
        <Text style={styles.paragraph}>{specObject.description_md}</Text>
      )}

      <Text
        style={styles.pageNumber}
        // @ts-expect-error - render prop is valid but not in types
        render={({ pageNumber }: { pageNumber: number }) => `${pageNumber}`}
        fixed
      />
    </Page>
  );
};

// Bill of Materials Component
const BillOfMaterialsPage: React.FC<{ bom: BOMItem[] }> = ({ bom }) => {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.heading1}>Bill of Materials</Text>

      <View style={styles.table}>
        {/* Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCol, styles.tableColName]}>Part Name</Text>
          <Text style={[styles.tableCol, styles.tableColQty]}>Quantity</Text>
          <Text style={[styles.tableCol, styles.tableColType]}>Type</Text>
          <Text style={[styles.tableCol, styles.tableColDesc]}>Description</Text>
        </View>

        {/* Rows */}
        {bom.map((item, idx) => {
          const attrs = item.lexiconItem.attributes as Record<string, unknown>;
          return (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.tableCol, styles.tableColName]}>
                {item.lexiconItem.name}
              </Text>
              <Text style={[styles.tableCol, styles.tableColQty]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCol, styles.tableColType]}>
                {item.lexiconItem.type}
              </Text>
              <Text style={[styles.tableCol, styles.tableColDesc]}>
                {attrs.description ? String(attrs.description) : "-"}
              </Text>
            </View>
          );
        })}
      </View>

      <Text
        style={styles.pageNumber}
        // @ts-expect-error - render prop is valid but not in types
        render={({ pageNumber }: { pageNumber: number }) => `${pageNumber}`}
        fixed
      />
    </Page>
  );
};

// Parts Sheets Component (just references, actual file embedding would need additional work)
const PartsSheetsPage: React.FC<{ partsSheets: PartSheet[] }> = ({
  partsSheets,
}) => {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.heading1}>Parts Sheets</Text>

      {partsSheets.map((sheet, idx) => {
        const attrs = sheet.lexiconItem.attributes as Record<string, unknown>;
        const hasDescription = Boolean(attrs.description);
        return (
          <View key={idx} style={{ marginBottom: 20 }}>
            <Text style={styles.heading2}>{sheet.lexiconItem.name}</Text>

            {hasDescription && (
              <Text style={styles.paragraph}>
                {String(attrs.description)}
              </Text>
            )}

            {sheet.files.length > 0 && (
              <View>
                <Text style={{ fontWeight: "bold", marginTop: 10 }}>
                  Attached Files:
                </Text>
                {sheet.files.map((file, fileIdx) => (
                  <Text key={fileIdx} style={{ marginLeft: 10, fontSize: 10 }}>
                    • {file.filename}
                  </Text>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <Text
        style={styles.pageNumber}
        // @ts-expect-error - render prop is valid but not in types
        render={({ pageNumber }: { pageNumber: number }) => `${pageNumber}`}
        fixed
      />
    </Page>
  );
};

// Generic Content Page Component
const ContentPage: React.FC<{ section: MarkdownSection }> = ({ section }) => {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.heading1}>{section.heading}</Text>
      <Text style={styles.paragraph}>{section.content.trim()}</Text>
      <Text
        style={styles.pageNumber}
        // @ts-expect-error - render prop is valid but not in types
        render={({ pageNumber }: { pageNumber: number }) => `${pageNumber}`}
        fixed
      />
    </Page>
  );
};

// Main Submittal PDF Document
export function createSubmittalPDF(data: SubmittalData) {
  const sections = parseMarkdownSections(data.submittalObject.description_md);

  // Find title and notes sections
  const titleSection = sections.find((s) =>
    s.heading.toLowerCase().includes("title")
  );
  const notesSection = sections.find((s) =>
    s.heading.toLowerCase().includes("notes")
  );

  // Other content sections (excluding title and notes for now)
  const contentSections = sections.filter(
    (s) =>
      !s.heading.toLowerCase().includes("title") &&
      !s.heading.toLowerCase().includes("notes")
  );

  return (
    <Document>
      {/* 1. Title Page */}
      <TitlePage data={data} titleSection={titleSection || null} />

      {/* 2. Table of Contents */}
      <TableOfContents sections={sections} />

      {/* 3. Specifications */}
      {data.specObject && <SpecificationsPage specObject={data.specObject} />}

      {/* 4. Notes Page */}
      {notesSection && <ContentPage section={notesSection} />}

      {/* 5. Bill of Materials */}
      {data.billOfMaterials.length > 0 && (
        <BillOfMaterialsPage bom={data.billOfMaterials} />
      )}

      {/* 6. Parts Sheets */}
      {data.partsSheets.length > 0 && (
        <PartsSheetsPage partsSheets={data.partsSheets} />
      )}

      {/* 7. Other Content Sections */}
      {contentSections.map((section, idx) => (
        <ContentPage key={idx} section={section} />
      ))}
    </Document>
  );
}
