"use client";

import OpenGraphPreview, {
  type OpenGraphPreviewData,
} from "@/components/waves/OpenGraphPreview";

const externalFileSamples: ReadonlyArray<{
  readonly href: string;
  readonly preview: OpenGraphPreviewData;
}> = [
  {
    href: "https://files.example.com/reports/attachment-safety.pdf",
    preview: {
      type: "external.file",
      title: "Attachment Safety Review.pdf",
      fileName: "Attachment Safety Review.pdf",
      extension: "pdf",
      fileKind: "pdf",
      contentType: "application/pdf",
      sizeBytes: 2_621_440,
      sourceHost: "files.example.com",
      trust: "external_unscanned",
      links: {
        open: "https://files.example.com/reports/attachment-safety.pdf",
      },
    },
  },
  {
    href: "https://data.example.com/exports/waves.csv",
    preview: {
      type: "external.file",
      title: "waves.csv",
      fileName: "waves.csv",
      extension: "csv",
      fileKind: "csv",
      contentType: "text/csv",
      sizeBytes: 48_128,
      sourceHost: "data.example.com",
      trust: "external_unscanned",
      links: { open: "https://data.example.com/exports/waves.csv" },
    },
  },
  {
    href: "https://media.example.com/art/preview.png",
    preview: {
      type: "external.file",
      title: "preview.png",
      fileName: "preview.png",
      extension: "png",
      fileKind: "image",
      contentType: "image/png",
      sizeBytes: 412_876,
      sourceHost: "media.example.com",
      trust: "external_unscanned",
      links: { open: "https://media.example.com/art/preview.png" },
    },
  },
  {
    href: "https://downloads.example.com/packages/export.zip",
    preview: {
      type: "external.file",
      title: "export.zip",
      fileName: "export.zip",
      extension: "zip",
      fileKind: "archive",
      contentType: "application/zip",
      sizeBytes: 9_830_400,
      sourceHost: "downloads.example.com",
      trust: "external_unscanned",
      links: { open: "https://downloads.example.com/packages/export.zip" },
    },
  },
  {
    href: "https://cdn.example.com/blob/7f2a",
    preview: {
      type: "external.file",
      title: "7f2a",
      fileName: "7f2a",
      extension: null,
      fileKind: "unknown",
      contentType: "application/octet-stream",
      sizeBytes: null,
      sourceHost: "cdn.example.com",
      trust: "external_unscanned",
      links: { open: "https://cdn.example.com/blob/7f2a" },
    },
  },
  {
    href: "https://6529.io/the-memes",
    preview: {
      title: "The Memes",
      description: "A normal OpenGraph page fallback.",
      siteName: "6529.io",
      url: "https://6529.io/the-memes",
    },
  },
];

export default function FilePreviewCardsDevPage() {
  return (
    <main className="tw-min-h-screen tw-bg-iron-950 tw-px-4 tw-py-6 tw-text-iron-100 sm:tw-px-8">
      <div className="tw-mx-auto tw-flex tw-max-w-3xl tw-flex-col tw-gap-4">
        <div>
          <h1 className="tw-text-xl tw-font-semibold">File Preview Cards</h1>
          <p className="tw-mt-1 tw-text-sm tw-text-iron-400">
            External file previews are metadata-only and unscanned.
          </p>
        </div>
        <div className="tw-flex tw-flex-col tw-gap-3">
          {externalFileSamples.map((sample) => (
            <OpenGraphPreview
              key={sample.href}
              href={sample.href}
              preview={sample.preview}
              hideActions
            />
          ))}
        </div>
      </div>
    </main>
  );
}
