import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { ScadaObject, LexiconItem, ObjectLexiconLink } from "@/lib/supabase/models";

// Register fonts if needed (optional)
// Font.register({ family: 'Roboto', src: 'path/to/font.ttf' });

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottom: "2pt solid #3b82f6",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
    borderBottom: "1pt solid #e5e7eb",
    paddingBottom: 3,
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    width: "30%",
    fontWeight: "bold",
    color: "#374151",
  },
  value: {
    width: "70%",
    color: "#4b5563",
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: 8,
    fontWeight: "bold",
    borderBottom: "1pt solid #d1d5db",
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottom: "0.5pt solid #e5e7eb",
  },
  tableCol1: {
    width: "40%",
  },
  tableCol2: {
    width: "20%",
  },
  tableCol3: {
    width: "40%",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 9,
    borderTop: "0.5pt solid #e5e7eb",
    paddingTop: 5,
  },
  badge: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: "3 8",
    borderRadius: 4,
    fontSize: 9,
    fontWeight: "bold",
  },
});

interface PurchaseReportDocumentProps {
  object: ScadaObject;
  lexiconItems: Array<{
    link: ObjectLexiconLink;
    item: LexiconItem;
  }>;
  projectName?: string;
  organizationName?: string;
}

export function PurchaseReportDocument({
  object,
  lexiconItems,
  projectName,
  organizationName,
}: PurchaseReportDocumentProps) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "#dc2626";
      case "high":
        return "#ea580c";
      case "medium":
        return "#ca8a04";
      case "low":
        return "#16a34a";
      default:
        return "#6b7280";
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Purchase Report</Text>
          <Text style={styles.subtitle}>
            {organizationName && `${organizationName} • `}
            {projectName && `${projectName} • `}
            Generated on {currentDate}
          </Text>
        </View>

        {/* Object Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Object Details</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Title:</Text>
            <Text style={styles.value}>{object.title}</Text>
          </View>

          {object.description_md && (
            <View style={styles.row}>
              <Text style={styles.label}>Description:</Text>
              <Text style={styles.value}>{object.description_md}</Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.label}>Priority:</Text>
            <Text style={[styles.value, { color: getPriorityColor(object.priority) }]}>
              {object.priority.toUpperCase()}
            </Text>
          </View>

          {object.assignee && (
            <View style={styles.row}>
              <Text style={styles.label}>Assignee:</Text>
              <Text style={styles.value}>{object.assignee}</Text>
            </View>
          )}

          {object.due_date && (
            <View style={styles.row}>
              <Text style={styles.label}>Due Date:</Text>
              <Text style={styles.value}>{object.due_date}</Text>
            </View>
          )}

          {object.metadata && typeof object.metadata === "object" && Object.keys(object.metadata).length > 0 && (
            <>
              {Object.entries(object.metadata as Record<string, unknown>).map(([key, value]) => (
                <View key={key} style={styles.row}>
                  <Text style={styles.label}>{key}:</Text>
                  <Text style={styles.value}>{String(value)}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Lexicon Items Section */}
        {lexiconItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Linked Parts & Specifications</Text>

            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={styles.tableCol1}>Name</Text>
                <Text style={styles.tableCol2}>Type</Text>
                <Text style={styles.tableCol3}>Details</Text>
              </View>

              {/* Table Rows */}
              {lexiconItems.map((lexItem, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCol1}>{lexItem.item.name}</Text>
                  <Text style={styles.tableCol2}>{lexItem.item.type}</Text>
                  <Text style={styles.tableCol3}>
                    {lexItem.item.sku ? `SKU: ${lexItem.item.sku}` : ""}
                    {lexItem.item.manufacturer ? ` • ${lexItem.item.manufacturer}` : ""}
                  </Text>
                </View>
              ))}
            </View>

            {/* Detailed Lexicon Items */}
            {lexiconItems.map((lexItem, index) => (
              <View key={index} style={{ marginTop: 15, marginBottom: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: "bold", marginBottom: 5 }}>
                  {lexItem.item.name}
                </Text>

                {lexItem.item.sku && (
                  <View style={styles.row}>
                    <Text style={styles.label}>SKU:</Text>
                    <Text style={styles.value}>{lexItem.item.sku}</Text>
                  </View>
                )}

                {lexItem.item.manufacturer && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Manufacturer:</Text>
                    <Text style={styles.value}>{lexItem.item.manufacturer}</Text>
                  </View>
                )}

                {lexItem.item.attributes && typeof lexItem.item.attributes === "object" && Object.keys(lexItem.item.attributes).length > 0 && (
                  <View style={{ marginTop: 5 }}>
                    <Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 3 }}>
                      Attributes:
                    </Text>
                    {Object.entries(lexItem.item.attributes as Record<string, unknown>).map(([key, value]) => (
                      <View key={key} style={styles.row}>
                        <Text style={[styles.label, { fontSize: 9 }]}>{key}:</Text>
                        <Text style={[styles.value, { fontSize: 9 }]}>{String(value)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {lexItem.link.note && (
                  <View style={{ marginTop: 5 }}>
                    <Text style={{ fontSize: 10, fontStyle: "italic", color: "#6b7280" }}>
                      Note: {lexItem.link.note}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>
            Generated by Lexicon Flow • {currentDate}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
