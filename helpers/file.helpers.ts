export const getFileInfoFromUrl = (
  url: string | undefined
): { name: string; extension: string } | null => {
  try {
    if (!url) {
      return null;
    }
    const { pathname } = new URL(url);
    const decodedPath = decodeURIComponent(pathname);
    const filename = decodedPath.split("/").pop() ?? "file";

    const lastDot = filename.lastIndexOf(".");
    if (lastDot > 0 && lastDot < filename.length - 1) {
      return {
        name: filename.slice(0, lastDot),
        extension: filename.slice(lastDot + 1),
      };
    }
    return null;
  } catch {
    return null;
  }
};