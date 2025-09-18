"use client";

import { type ReactElement, useEffect, useState } from "react";

import OpenGraphPreview, {
  hasOpenGraphContent,
  LinkPreviewCardLayout,
  type OpenGraphPreviewData,
} from "./OpenGraphPreview";
import OfficePreviewCard, {
  type OfficePreviewData,
  type OfficePreviewLinks,
  type OfficePreviewType,
} from "./OfficePreviewCard";
import { fetchLinkPreview } from "../../services/api/link-preview-api";

interface LinkPreviewCardProps {
  readonly href: string;
  readonly renderFallback: () => ReactElement;
}

type PreviewState =
  | { readonly type: "loading" }
  | { readonly type: "success"; readonly data: OpenGraphPreviewData }
  | { readonly type: "office"; readonly data: OfficePreviewData }
  | { readonly type: "fallback" };

const toPreviewData = (
  response: Awaited<ReturnType<typeof fetchLinkPreview>>
): OpenGraphPreviewData => {
  if (!response) {
    return {};
  }

  return {
    ...response,
    image: response.image ?? undefined,
    images: response.images ?? undefined,
    url: response.url ?? response.requestUrl ?? undefined,
    siteName: response.siteName ?? undefined,
    description: response.description ?? undefined,
    title: response.title ?? undefined,
  };
};

const OFFICE_TYPES: ReadonlySet<OfficePreviewType> = new Set<OfficePreviewType>([
  "office.word",
  "office.excel",
  "office.powerpoint",
]);

const DEFAULT_OFFICE_TITLES: Record<OfficePreviewType, string> = {
  "office.word": "Microsoft Word document",
  "office.excel": "Microsoft Excel workbook",
  "office.powerpoint": "Microsoft PowerPoint presentation",
};

const readString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeOfficeLinks = (value: unknown): OfficePreviewLinks | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const open = readString(record.open);
  if (!open) {
    return null;
  }

  const preview =
    record.preview === null ? null : readString(record.preview) ?? null;
  const officeViewer =
    record.officeViewer === null
      ? null
      : readString(record.officeViewer) ?? null;
  const exportPdf =
    record.exportPdf === null ? null : readString(record.exportPdf) ?? null;

  return {
    open,
    preview,
    officeViewer,
    exportPdf,
  };
};

const toOfficePreview = (
  response: Awaited<ReturnType<typeof fetchLinkPreview>>
): OfficePreviewData | null => {
  if (!response || typeof response !== "object") {
    return null;
  }

  const record = response as Record<string, unknown>;
  const type = readString(record.type);
  if (!type || !OFFICE_TYPES.has(type as OfficePreviewType)) {
    return null;
  }

  const officeType = type as OfficePreviewType;
  const links = normalizeOfficeLinks(record.links);
  if (!links) {
    return null;
  }

  const canonicalUrl = readString(record.canonicalUrl) ?? links.open;
  const title = readString(record.title) ?? DEFAULT_OFFICE_TITLES[officeType];
  const thumbnail = readString(record.thumbnail);
  const availabilityValue = readString(record.availability);
  const availability =
    availabilityValue === "unavailable" ? "unavailable" : "public";

  const excelRaw = record.excel;
  const excelData =
    officeType === "office.excel" && excelRaw && typeof excelRaw === "object"
      ? { allowInteractivity: Boolean((excelRaw as Record<string, unknown>).allowInteractivity) }
      : undefined;

  const officeData: OfficePreviewData = {
    type: officeType,
    title,
    canonicalUrl,
    thumbnail: thumbnail ?? null,
    links,
    availability,
    ...(excelData ? { excel: excelData } : {}),
  };

  return officeData;
};

export default function LinkPreviewCard({
  href,
  renderFallback,
}: LinkPreviewCardProps) {
  const [state, setState] = useState<PreviewState>({ type: "loading" });

  useEffect(() => {
    let active = true;

    setState({ type: "loading" });

    fetchLinkPreview(href)
      .then((response) => {
        if (!active) {
          return;
        }

        const officePreview = toOfficePreview(response);
        if (officePreview) {
          setState({ type: "office", data: officePreview });
          return;
        }

        const previewData = toPreviewData(response);
        if (hasOpenGraphContent(previewData)) {
          setState({ type: "success", data: previewData });
        } else {
          setState({ type: "fallback" });
        }
      })
      .catch(() => {
        if (active) {
          setState({ type: "fallback" });
        }
      });

    return () => {
      active = false;
    };
  }, [href]);

  if (state.type === "fallback") {
    const fallbackContent = renderFallback();

    return (
      <LinkPreviewCardLayout href={href}>
        <div
          className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
          <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-start">
            {fallbackContent}
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  }

  if (state.type === "office") {
    return <OfficePreviewCard href={href} data={state.data} />;
  }

  const preview = state.type === "success" ? state.data : undefined;

  return <OpenGraphPreview href={href} preview={preview} />;
}
