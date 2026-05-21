import type { CreateDropConfig } from "@/entities/IDrop";

const INLINE_IMAGE_UPLOAD_MARKDOWN_PLACEHOLDER = "![Seize](loading)";

export const hasPendingInlineImageUploadMarkdown = (
  content: string | null | undefined
): boolean =>
  content?.includes(INLINE_IMAGE_UPLOAD_MARKDOWN_PLACEHOLDER) ?? false;

export const hasPendingInlineImageUploadDrop = (
  drop: Pick<CreateDropConfig, "parts">
): boolean =>
  drop.parts.some((part) => hasPendingInlineImageUploadMarkdown(part.content));
