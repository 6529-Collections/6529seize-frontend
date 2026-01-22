export type SubmissionMediaCategory = "image" | "video" | "interactive";

export interface SubmissionMediaType {
  mimeType: string;
  format: string;
  category: SubmissionMediaCategory;
  label: string;
}

const SUBMISSION_MEDIA_TYPES: SubmissionMediaType[] = [
  {
    mimeType: "image/png",
    format: "PNG",
    category: "image",
    label: "Image - PNG",
  },
  {
    mimeType: "image/jpeg",
    format: "JPEG",
    category: "image",
    label: "Image - JPEG",
  },
  {
    mimeType: "image/jpg",
    format: "JPEG",
    category: "image",
    label: "Image - JPEG",
  },
  {
    mimeType: "image/gif",
    format: "GIF",
    category: "image",
    label: "Image - GIF",
  },
  {
    mimeType: "video/mp4",
    format: "MP4",
    category: "video",
    label: "Video - MP4",
  },
  {
    mimeType: "video/quicktime",
    format: "MOV",
    category: "video",
    label: "Video - MOV",
  },
  {
    mimeType: "model/gltf-binary",
    format: "GLB",
    category: "interactive",
    label: "Interactive - GLB",
  },
  {
    mimeType: "model/gltf+json",
    format: "GLTF",
    category: "interactive",
    label: "Interactive - GLTF",
  },
  {
    mimeType: "text/html",
    format: "HTML",
    category: "interactive",
    label: "Interactive - HTML",
  },
];

export const SUBMISSION_IMAGE_MIME_TYPES = SUBMISSION_MEDIA_TYPES.filter(
  (t) => t.category === "image"
).map((t) => t.mimeType);

export const SUBMISSION_INTERACTIVE_MIME_TYPES = SUBMISSION_MEDIA_TYPES.filter(
  (t) => t.category === "interactive"
).map((t) => t.mimeType);

export const SUBMISSION_FILE_INPUT_ACCEPT =
  "image/png,image/jpeg,image/jpg,image/gif,video/mp4,video/quicktime,.mov,model/gltf-binary,model/gltf+json,application/octet-stream,.glb,.gltf";

export const SUBMISSION_UI_FORMAT_CATEGORIES = [
  "PNG",
  "JPG",
  "GIF",
  "VIDEO",
  "GLB",
];

const CATEGORY_STYLES: Record<
  SubmissionMediaCategory,
  { text: string; bg: string; border: string }
> = {
  image: {
    text: "rgba(16, 185, 129, 0.7)",
    bg: "rgba(16, 185, 129, 0.08)",
    border: "rgba(16, 185, 129, 0.2)",
  },
  video: {
    text: "rgba(167, 139, 250, 0.7)",
    bg: "rgba(167, 139, 250, 0.08)",
    border: "rgba(167, 139, 250, 0.2)",
  },
  interactive: {
    text: "rgba(56, 189, 248, 0.7)",
    bg: "rgba(56, 189, 248, 0.08)",
    border: "rgba(56, 189, 248, 0.2)",
  },
};

interface SubmissionMediaTypeInfo {
  category: SubmissionMediaCategory;
  format: string;
  label: string;
  styles: { text: string; bg: string; border: string };
}

const DEFAULT_STYLES = {
  text: "rgba(113, 113, 122, 0.7)",
  bg: "rgba(113, 113, 122, 0.08)",
  border: "rgba(113, 113, 122, 0.2)",
};

export const getSubmissionMediaTypeInfo = (
  mimeType: string | undefined
): SubmissionMediaTypeInfo => {
  if (!mimeType) {
    return {
      category: "image",
      format: "UNKNOWN",
      label: "Unknown",
      styles: DEFAULT_STYLES,
    };
  }

  const found = SUBMISSION_MEDIA_TYPES.find((t) => t.mimeType === mimeType);
  if (found) {
    return {
      category: found.category,
      format: found.format,
      label: found.label,
      styles: CATEGORY_STYLES[found.category],
    };
  }

  if (mimeType.startsWith("image/")) {
    const format = mimeType.split("/")[1]?.toUpperCase() ?? "UNKNOWN";
    return {
      category: "image",
      format,
      label: `Image - ${format}`,
      styles: CATEGORY_STYLES.image,
    };
  }

  if (mimeType.startsWith("video/")) {
    const format = mimeType.split("/")[1]?.toUpperCase() ?? "UNKNOWN";
    return {
      category: "video",
      format,
      label: `Video - ${format}`,
      styles: CATEGORY_STYLES.video,
    };
  }

  if (mimeType === "application/octet-stream") {
    return {
      category: "interactive",
      format: "GLB",
      label: "Interactive - GLB",
      styles: CATEGORY_STYLES.interactive,
    };
  }

  return {
    category: "image",
    format: "UNKNOWN",
    label: "Unknown",
    styles: DEFAULT_STYLES,
  };
};
