/**
 * Downloads a JSON string as a file and releases the temporary object URL as
 * soon as the download has been triggered.
 */
export function downloadJsonFile(json: string, fileName: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = globalThis.URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
  } finally {
    globalThis.URL.revokeObjectURL(url);
  }
}
