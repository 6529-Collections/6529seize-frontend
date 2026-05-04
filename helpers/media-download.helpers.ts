export function getDownloadFilenameFromUrl(url: string, fallback = "media") {
  try {
    const pathname = new URL(url).pathname;
    const name = pathname.split("/").filter(Boolean).pop();
    return name ? decodeURIComponent(name) : fallback;
  } catch {
    const name = url.split("?")[0]?.split("#")[0]?.split("/").pop();
    return name || fallback;
  }
}
