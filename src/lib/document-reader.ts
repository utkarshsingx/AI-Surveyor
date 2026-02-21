import { readFileSync } from "fs";
import { join } from "path";

const MAX_CHARS = 120000; // ~30k tokens for context limit safety

/**
 * Read document content from public path or buffer.
 * For PDFs, returns placeholder if no parser available; text files read as UTF-8.
 */
export function readDocumentContent(
  filePathOrBuffer: string | Buffer,
  fileName: string,
  fallbackSummary?: string
): string {
  let raw: string;
  if (Buffer.isBuffer(filePathOrBuffer)) {
    raw = filePathOrBuffer.toString("utf-8");
  } else {
    try {
      const fullPath = filePathOrBuffer.startsWith("/")
        ? join(process.cwd(), "public", filePathOrBuffer)
        : filePathOrBuffer;
      raw = readFileSync(fullPath, "utf-8");
    } catch {
      return fallbackSummary || `[Document: ${fileName}]`;
    }
  }

  const cleaned = raw
    .replace(/\r\n/g, "\n")
    .replace(/\0/g, "")
    .replace(/[^\x20-\x7E\n\r\t]/g, " ");
  const printableRatio = (cleaned.match(/[\x20-\x7E\n\r\t]/g) || []).length / (raw.length || 1);
  if (printableRatio < 0.7 && raw.length > 500) {
    return (
      fallbackSummary ||
      `[PDF or binary document: ${fileName}. Content could not be extracted as text. Please use a text-based format for full analysis.]`
    );
  }
  const truncated =
    cleaned.length > MAX_CHARS ? cleaned.slice(0, MAX_CHARS) + "\n\n[... document truncated ...]" : cleaned;
  return truncated.trim() || fallbackSummary || `[Document: ${fileName}]`;
}
