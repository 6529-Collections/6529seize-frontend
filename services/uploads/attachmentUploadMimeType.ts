import { ApiAttachmentUploadMimeType } from "@/generated/models/ApiAttachmentUploadMimeType";
import { getContentType } from "@/services/uploads/mediaUploadMimeType";

const MAX_PDF_BYTES = 25 * 1024 * 1024;
const MAX_CSV_BYTES = 50 * 1024 * 1024;

function normalizeMimeType(mimeType: string): string {
  if (!mimeType) return "";
  return (mimeType.split(";")[0]?.trim() ?? "").toLowerCase();
}

function getLowerFileName(file: File): string {
  return file.name.toLowerCase();
}

export function toApiAttachmentUploadMimeType(
  mimeType: string
): ApiAttachmentUploadMimeType | null {
  const normalizedMimeType = normalizeMimeType(mimeType);

  if (normalizedMimeType === ApiAttachmentUploadMimeType.ApplicationPdf) {
    return ApiAttachmentUploadMimeType.ApplicationPdf;
  }

  if (normalizedMimeType === ApiAttachmentUploadMimeType.TextCsv) {
    return ApiAttachmentUploadMimeType.TextCsv;
  }

  return null;
}

export function getApiAttachmentUploadMimeType(
  file: File
): ApiAttachmentUploadMimeType | null {
  const lowerFileName = getLowerFileName(file);
  if (lowerFileName.endsWith(".pdf")) {
    return ApiAttachmentUploadMimeType.ApplicationPdf;
  }
  if (lowerFileName.endsWith(".csv")) {
    return ApiAttachmentUploadMimeType.TextCsv;
  }
  return toApiAttachmentUploadMimeType(getContentType(file));
}

export function isAttachmentUploadFile(file: File): boolean {
  return getApiAttachmentUploadMimeType(file) !== null;
}

export function validateAttachmentUploadFile(file: File): void {
  const contentType = getApiAttachmentUploadMimeType(file);
  const fileName = file.name;
  const lowerFileName = getLowerFileName(file);

  if (!contentType) {
    return;
  }

  if (fileName.includes("\0")) {
    throw new Error("File names cannot contain NUL bytes.");
  }

  if (fileName.includes("/") || fileName.includes("\\")) {
    throw new Error("File names cannot contain path separators.");
  }

  if (
    contentType === ApiAttachmentUploadMimeType.ApplicationPdf &&
    !lowerFileName.endsWith(".pdf")
  ) {
    throw new Error("PDF uploads must use a .pdf file extension.");
  }

  if (
    contentType === ApiAttachmentUploadMimeType.TextCsv &&
    !lowerFileName.endsWith(".csv")
  ) {
    throw new Error("CSV uploads must use a .csv file extension.");
  }

  const browserMimeType = normalizeMimeType(file.type);
  if (
    browserMimeType &&
    browserMimeType !== "application/octet-stream" &&
    browserMimeType !== "application/vnd.ms-excel" &&
    browserMimeType !== contentType
  ) {
    throw new Error("Attachment file extension does not match its MIME type.");
  }

  if (
    contentType === ApiAttachmentUploadMimeType.ApplicationPdf &&
    file.size > MAX_PDF_BYTES
  ) {
    throw new Error(
      "PDF uploads must be 25 MB or smaller and no more than 100 pages."
    );
  }

  if (
    contentType === ApiAttachmentUploadMimeType.TextCsv &&
    file.size > MAX_CSV_BYTES
  ) {
    throw new Error("CSV uploads must be 50 MB or smaller.");
  }
}
