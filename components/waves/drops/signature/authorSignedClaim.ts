import type { ApiDrop } from "@/generated/models/ApiDrop";
import { isSignedMessagesEnabled } from "@/lib/device-signing/feature";

type AuthorSignableDrop = Pick<ApiDrop, "id" | "is_author_signed">;

/**
 * Whether 6529.io says the drop's current content is signed by its author.
 * This decides whether a drop gets a seal and is checked at all; what the
 * seal says comes from this browser's own check (dropSignatureVerdicts).
 * Positive-only: unsigned drops get no marker at all.
 */
export const isDropAuthorSigned = (drop: AuthorSignableDrop): boolean =>
  isSignedMessagesEnabled() &&
  drop.is_author_signed === true &&
  !drop.id.startsWith("temp-");
