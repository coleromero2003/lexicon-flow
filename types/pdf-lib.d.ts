declare module "pdf-lib" {
  export class PDFPage {}

  export class PDFDocument {
    static create(): Promise<PDFDocument>;
    static load(data: ArrayBuffer | Uint8Array): Promise<PDFDocument>;

    getPageCount(): number;
    copyPages(document: PDFDocument, indices: number[]): Promise<PDFPage[]>;
    addPage(page: PDFPage): void;
    save(): Promise<Uint8Array>;
  }
}
