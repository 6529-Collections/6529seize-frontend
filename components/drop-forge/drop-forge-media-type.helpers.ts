import type { MintingClaim } from "@/generated/models/MintingClaim";

type DropForgeAnimationKind = "video" | "glb" | "html" | "animation";

function normalizeMediaFormat(
  format: string | null | undefined
): string | null {
  const trimmedFormat = format?.trim();
  return trimmedFormat ? trimmedFormat.toUpperCase() : null;
}

export function getDropForgeUrlExtension(
  url: string | null | undefined
): string | null {
  if (!url) return null;
  try {
    const { pathname } = new URL(url);
    if (pathname.endsWith("/")) return null;
    const lastSegment = pathname.split("/").at(-1);
    if (!lastSegment) return null;
    const extensionIndex = lastSegment.lastIndexOf(".");
    if (extensionIndex <= 0 || extensionIndex === lastSegment.length - 1) {
      return null;
    }
    return lastSegment.slice(extensionIndex + 1).toLowerCase();
  } catch {
    const clean = url.split("?")[0]?.split("#")[0] ?? "";
    if (clean.endsWith("/")) return null;
    const lastSegment = clean.split("/").at(-1);
    if (!lastSegment) return null;
    const extensionIndex = lastSegment.lastIndexOf(".");
    if (extensionIndex <= 0 || extensionIndex === lastSegment.length - 1) {
      return null;
    }
    return lastSegment.slice(extensionIndex + 1).toLowerCase();
  }
}

export function isDropForgeVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.trim().toLowerCase().startsWith("data:video/")) return true;
  return ["mp4", "webm", "mov", "qt", "m4v", "ogv", "ogg"].includes(
    getDropForgeUrlExtension(url) ?? ""
  );
}

function getDropForgeImageFormat(claim: MintingClaim): string | null {
  const fromDetails = normalizeMediaFormat(claim.image_details?.format);
  if (fromDetails) return fromDetails === "JPG" ? "JPEG" : fromDetails;

  const ext = getDropForgeUrlExtension(claim.image_url);
  if (ext === "jpg" || ext === "jpeg") return "JPEG";
  if (ext === "png") return "PNG";
  if (ext === "gif") return "GIF";
  if (ext === "webp") return "WEBP";
  return null;
}

export function getDropForgeAnimationInfo(
  claim: MintingClaim
): { kind: DropForgeAnimationKind; subtype?: string | null } | null {
  if (!claim.animation_url && !claim.animation_details) return null;

  const format = normalizeMediaFormat(
    (claim.animation_details as { format?: string } | null | undefined)?.format
  );
  if (format === "HTML") return { kind: "html" };
  if (format === "GLB") return { kind: "glb" };
  if (format) return { kind: "video", subtype: format };

  const ext = getDropForgeUrlExtension(claim.animation_url);
  if (ext === "html" || ext === "htm") return { kind: "html" };
  if (ext === "glb") return { kind: "glb" };
  if (ext === "mp4") return { kind: "video", subtype: "MP4" };
  if (ext === "webm") return { kind: "video", subtype: "WEBM" };
  if (isDropForgeVideoUrl(claim.animation_url)) return { kind: "video" };
  return { kind: "animation" };
}

export function getDropForgeImageMediaTypeLabel(
  claim: MintingClaim
): string | null {
  const imageFormat = getDropForgeImageFormat(claim);
  if (imageFormat) return `IMAGE/${imageFormat}`;
  if (claim.image_url || claim.image_details) return "IMAGE";
  return null;
}

export function getDropForgeAnimationMediaTypeLabel(
  claim: MintingClaim
): string | null {
  const animationInfo = getDropForgeAnimationInfo(claim);
  if (!animationInfo) return null;
  if (animationInfo.kind === "html" || animationInfo.kind === "glb") {
    return animationInfo.kind.toUpperCase();
  }
  if (animationInfo.kind === "video") {
    return animationInfo.subtype ? `VIDEO/${animationInfo.subtype}` : "VIDEO";
  }
  return "ANIMATION";
}

export function getDropForgeMediaTypeLabel(claim: MintingClaim): string {
  return (
    getDropForgeAnimationMediaTypeLabel(claim) ??
    getDropForgeImageMediaTypeLabel(claim) ??
    "—"
  );
}
