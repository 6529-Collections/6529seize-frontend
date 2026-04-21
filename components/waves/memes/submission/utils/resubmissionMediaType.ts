interface ResubmissionMediaTypeInput {
  readonly mimeType?: string | null | undefined;
  readonly fileName?: string | null | undefined;
  readonly url?: string | null | undefined;
}

interface ResubmissionMediaTypeInfo {
  readonly label: string | null;
  readonly isInteractive: boolean;
}

const getLowercaseValue = (value: string | null | undefined): string =>
  value?.trim().toLowerCase() ?? "";

const hasExtension = (
  value: string | null | undefined,
  extension: ".glb" | ".gltf"
): boolean =>
  getLowercaseValue(value).split(/[?#]/)[0]?.endsWith(extension) ?? false;

const isGltfMedia = ({
  mimeType,
  fileName,
  url,
}: ResubmissionMediaTypeInput): boolean => {
  const normalizedMimeType = getLowercaseValue(mimeType);
  return (
    normalizedMimeType.startsWith("model/gltf") ||
    hasExtension(fileName, ".glb") ||
    hasExtension(fileName, ".gltf") ||
    hasExtension(url, ".glb") ||
    hasExtension(url, ".gltf")
  );
};

const getGltfLabel = ({
  mimeType,
  fileName,
  url,
}: ResubmissionMediaTypeInput): "GLB" | "GLTF" => {
  const normalizedMimeType = getLowercaseValue(mimeType);
  if (
    normalizedMimeType.startsWith("model/gltf-binary") ||
    hasExtension(fileName, ".glb") ||
    hasExtension(url, ".glb")
  ) {
    return "GLB";
  }

  return "GLTF";
};

export const getResubmissionMediaTypeInfo = (
  media: ResubmissionMediaTypeInput
): ResubmissionMediaTypeInfo => {
  const normalizedMimeType = getLowercaseValue(media.mimeType);

  if (normalizedMimeType.startsWith("video/")) {
    return { label: "Video", isInteractive: false };
  }

  if (normalizedMimeType === "text/html") {
    return { label: "HTML", isInteractive: true };
  }

  if (isGltfMedia(media)) {
    return { label: getGltfLabel(media), isInteractive: true };
  }

  return { label: null, isInteractive: false };
};
