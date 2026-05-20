import mammoth from "mammoth";

export async function extractText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }

  if (fileName.endsWith(".pdf")) {
    try {
      const pdfParse = require("pdf-parse/lib/pdf-parse");
      const data = await pdfParse(buffer);
      return data.text || "";
    } catch {
      throw new Error(
        "This PDF could not be read. Try exporting it again, or upload a DOCX version."
      );
    }
  }

  throw new Error("Only PDF and DOCX files are supported.");
}