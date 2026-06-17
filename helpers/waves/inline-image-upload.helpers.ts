import type { CreateDropConfig } from "@/entities/IDrop";

const INLINE_IMAGE_UPLOAD_MARKDOWN_PLACEHOLDER = "![Seize](loading)";
const INLINE_IMAGE_DATA_URL_MARKDOWN_PATTERN =
  /!\[[^\]]*\]\(data:image\/[a-z0-9.+-]+;base64,[^)]+\)/i;

export const hasPendingInlineImageUploadMarkdown = (
  content: string | null | undefined
): boolean =>
  Boolean(content?.includes(INLINE_IMAGE_UPLOAD_MARKDOWN_PLACEHOLDER)) ||
  INLINE_IMAGE_DATA_URL_MARKDOWN_PATTERN.test(content ?? "");

export const hasPendingInlineImageUploadDrop = (
  drop: Pick<CreateDropConfig, "parts">
): boolean =>
  drop.parts.some((part) => hasPendingInlineImageUploadMarkdown(part.content));
