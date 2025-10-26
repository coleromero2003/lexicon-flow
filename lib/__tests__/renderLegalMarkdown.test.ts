import { describe, it, expect, vi, beforeEach } from "vitest";

import { renderLegalMarkdown } from "../renderMarkdown";

const fsMocks = vi.hoisted(() => ({
  readFileMock: vi.fn<[
    path: string,
    encoding: string
  ], Promise<string>>(),
}));

vi.mock("node:fs/promises", () => ({
  default: {
    readFile: fsMocks.readFileMock,
  },
}));

describe("renderLegalMarkdown", () => {
  beforeEach(() => {
    fsMocks.readFileMock.mockReset();
  });

  it("renders HTML when the markdown file can be read", async () => {
    fsMocks.readFileMock.mockResolvedValueOnce(`# Terms of Service\n\nWelcome to the terms.`);

    const html = await renderLegalMarkdown("Terms_of_Service.md");

    expect(fsMocks.readFileMock).toHaveBeenCalledWith(
      expect.stringContaining("public/legal/Terms_of_Service.md"),
      "utf8",
    );
    expect(html).toContain("<h1>Terms of Service</h1>");
    expect(html).toContain("<p>Welcome to the terms.</p>");
  });

  it("returns the fallback message when the markdown file cannot be read", async () => {
    const error = new Error("File not found");
    fsMocks.readFileMock.mockRejectedValueOnce(error);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const html = await renderLegalMarkdown("Terms_of_Service.md");

    expect(fsMocks.readFileMock).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Terms_of_Service.md"), error);
    expect(html).toBe(
      `<h1>Document not found</h1><p>The requested legal document could not be loaded.</p>`,
    );

    consoleSpy.mockRestore();
  });
});
