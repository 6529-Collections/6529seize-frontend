import { useState } from "react";

import { getString } from "@/components/profile-cms/site-renderer/data";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type {
  CmsBlockV1,
  CmsPackageV1,
  CmsPageV1,
} from "@/lib/profile-cms/protocol/v1";
import type { CmsDocumentOperation } from "@/lib/profile-cms/studio/document";
import {
  CMS_STUDIO_ROLES,
  CMS_STUDIO_SPANS,
  getCmsStudioBlockPresentation,
} from "@/lib/profile-cms/studio/presentation";
import { StudioButton, StudioField, StudioSelect } from "./StudioControls";
import StudioForm, { type StudioFormState } from "./StudioForm";

const HEADING_LABEL = "profileCms.studio.heading";
const TEXT_LABEL = "profileCms.studio.text";
export const STUDIO_BLOCK_LABELS = {
  heading: HEADING_LABEL,
  rich_text: TEXT_LABEL,
  image: "profileCms.studio.image",
  quote: "profileCms.studio.quote",
  callout: "profileCms.studio.callout",
  button_link: "profileCms.studio.link",
  gallery: "profileCms.studio.imageGallery",
  video: "profileCms.studio.video",
  audio: "profileCms.studio.audio",
} as const satisfies Partial<Record<CmsBlockV1["block_type"], MessageKey>>;

export function getStudioBlockLabel(
  type: CmsBlockV1["block_type"]
): MessageKey {
  const labels: Partial<Record<CmsBlockV1["block_type"], MessageKey>> =
    STUDIO_BLOCK_LABELS;
  return labels[type] ?? "profileCms.studio.section";
}

const BLOCK_FIELDS: Partial<
  Record<
    CmsBlockV1["block_type"],
    readonly { key: string; label: MessageKey; multiline?: boolean }[]
  >
> = {
  heading: [{ key: "text", label: HEADING_LABEL }],
  rich_text: [{ key: "content", label: TEXT_LABEL, multiline: true }],
  image: [
    { key: "title", label: "profileCms.studio.pageTitle" },
    { key: "caption", label: "profileCms.studio.caption", multiline: true },
  ],
  quote: [
    { key: "quote", label: "profileCms.studio.quote", multiline: true },
    { key: "citation", label: "profileCms.studio.citation" },
  ],
  callout: [
    { key: "title", label: HEADING_LABEL },
    { key: "content", label: TEXT_LABEL, multiline: true },
  ],
  button_link: [{ key: "label", label: "profileCms.studio.label" }],
  gallery: [
    { key: "title", label: HEADING_LABEL },
    {
      key: "description",
      label: "profileCms.studio.description",
      multiline: true,
    },
  ],
  video: [{ key: "title", label: "profileCms.studio.pageTitle" }],
  audio: [{ key: "title", label: "profileCms.studio.pageTitle" }],
};

const WIDTH_LABELS = {
  full: "profileCms.studio.full",
  half: "profileCms.studio.half",
  third: "profileCms.studio.third",
  two_thirds: "profileCms.studio.twoThirds",
} as const;

export function createStudioBlock(
  kind: keyof typeof STUDIO_BLOCK_LABELS,
  locale: SupportedLocale
): CmsBlockV1 & Record<string, unknown> {
  const base = {
    id: `block-${globalThis.crypto.randomUUID()}`,
    block_type: kind,
    presentation: { span: "full", role: "body" },
  };
  switch (kind) {
    case "heading":
      return {
        ...base,
        text: t(locale, HEADING_LABEL),
        level: 2,
      };
    case "rich_text":
      return { ...base, content: t(locale, TEXT_LABEL) };
    case "button_link":
      return {
        ...base,
        label: t(locale, "profileCms.studio.link"),
        href: "https://6529.io",
      };
    case "quote":
      return {
        ...base,
        quote: t(locale, "profileCms.studio.quote"),
        citation: "",
      };
    case "callout":
      return {
        ...base,
        title: t(locale, "profileCms.studio.callout"),
        content: "",
        tone: "note",
      };
    case "gallery":
      return {
        ...base,
        title: t(locale, "profileCms.studio.imageGallery"),
        asset_ids: [],
      };
    case "image":
    case "video":
    case "audio":
      return base;
  }
}

export default function StudioBlockInspector({
  document,
  page,
  block,
  locale,
  onOperation,
  formState,
}: {
  readonly document: CmsPackageV1;
  readonly page: CmsPageV1;
  readonly block: CmsBlockV1;
  readonly locale: SupportedLocale;
  readonly onOperation: (operation: CmsDocumentOperation) => boolean;
  readonly formState: StudioFormState;
}) {
  const fields = BLOCK_FIELDS[block.block_type] ?? [];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((field) => [field.key, getString(block, field.key) ?? ""])
    )
  );
  const [assetId, setAssetId] = useState(getString(block, "asset_id") ?? "");
  const asset = document.payload.assets.find((item) => item.id === assetId);
  const [altText, setAltText] = useState(asset?.alt_text ?? "");
  const [rights, setRights] = useState(asset?.rights ?? "");
  const [destination, setDestination] = useState(
    getString(block, "page_id") ?? "external"
  );
  const [href, setHref] = useState(
    getString(block, "href") ?? getString(block, "url") ?? ""
  );
  const [design, setDesign] = useState(getCmsStudioBlockPresentation(block));
  const [galleryIds, setGalleryIds] = useState<string[]>(() => {
    const ids = (block as CmsBlockV1 & Record<string, unknown>)["asset_ids"];
    return Array.isArray(ids)
      ? ids.filter((id): id is string => typeof id === "string")
      : [];
  });
  const media = ["image", "video", "audio"].includes(block.block_type);
  const submit = () => {
    const originalPresentation = (
      block as CmsBlockV1 & Record<string, unknown>
    )["presentation"];
    const patch: Record<string, unknown> = {
      ...values,
      presentation: {
        ...(originalPresentation !== null &&
        typeof originalPresentation === "object"
          ? originalPresentation
          : {}),
        ...design,
      },
    };
    const removeFields: string[] = [];
    if (media && assetId) patch["asset_id"] = assetId;
    if (block.block_type === "gallery") patch["asset_ids"] = galleryIds;
    if (block.block_type === "button_link") {
      if (destination === "external") {
        patch["href"] = href;
        removeFields.push("page_id", "url");
      } else {
        patch["page_id"] = destination;
        removeFields.push("href", "url");
      }
    }
    const operations: CmsDocumentOperation[] = [
      {
        type: "update_block",
        pageId: page.id,
        blockId: block.id,
        patch,
        removeFields,
      },
    ];
    if (media && asset)
      operations.push({
        type: "update_asset",
        assetId: asset.id,
        patch: { alt_text: altText, rights },
      });
    return onOperation({ type: "batch", operations });
  };
  const label = getStudioBlockLabel(block.block_type);

  return (
    <StudioForm locale={locale} state={formState} onSubmit={submit}>
      <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-white">
        {t(locale, label)}
      </h3>
      {!fields.length && !media ? (
        <p className="tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "profileCms.studio.unknownSection")}
        </p>
      ) : null}
      {fields.map((field) => (
        <StudioField
          key={field.key}
          label={t(locale, field.label)}
          value={values[field.key] ?? ""}
          onChange={(value) =>
            setValues((current) => ({ ...current, [field.key]: value }))
          }
          multiline={field.multiline}
        />
      ))}
      {media ? (
        <>
          <StudioSelect
            label={t(locale, "profileCms.studio.imageSource")}
            value={assetId}
            options={[
              { value: "", label: t(locale, "profileCms.studio.replaceImage") },
              ...document.payload.assets
                .filter(
                  (item) =>
                    item.kind === block.block_type ||
                    (block.block_type === "image" &&
                      item.kind === "social_image")
                )
                .map((item) => ({
                  value: item.id,
                  label:
                    item.alt_text !== undefined && item.alt_text.length > 0
                      ? item.alt_text
                      : item.id,
                })),
            ]}
            onChange={(value) => {
              setAssetId(value);
              const next = document.payload.assets.find(
                (item) => item.id === value
              );
              setAltText(next?.alt_text ?? "");
              setRights(next?.rights ?? "");
            }}
          />
          <StudioField
            label={t(locale, "profileCms.studio.altText")}
            value={altText}
            onChange={setAltText}
            multiline
          />
          <StudioField
            label={t(locale, "profileCms.studio.rights")}
            value={rights}
            onChange={setRights}
          />
        </>
      ) : null}
      {block.block_type === "button_link" ? (
        <>
          <StudioSelect
            label={t(locale, "profileCms.studio.destination")}
            value={destination}
            options={[
              {
                value: "external",
                label: t(locale, "profileCms.studio.externalLink"),
              },
              ...document.payload.pages.map((item) => ({
                value: item.id,
                label: item.metadata.title,
              })),
            ]}
            onChange={setDestination}
          />
          {destination === "external" ? (
            <StudioField
              label={t(locale, "profileCms.studio.linkUrl")}
              value={href}
              onChange={setHref}
            />
          ) : null}
        </>
      ) : null}
      {block.block_type === "gallery" ? (
        <fieldset className="tw-space-y-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-p-3">
          <legend className="tw-px-1 tw-text-xs tw-text-iron-300">
            {t(locale, "profileCms.studio.selectImages")}
          </legend>
          {document.payload.assets
            .filter((item) => item.kind === "image")
            .map((item) => (
              <label
                key={item.id}
                className="tw-flex tw-items-start tw-gap-3 tw-text-sm tw-leading-6"
              >
                <input
                  type="checkbox"
                  checked={galleryIds.includes(item.id)}
                  onChange={(event) =>
                    setGalleryIds((current) =>
                      event.target.checked
                        ? [...current, item.id]
                        : current.filter((id) => id !== item.id)
                    )
                  }
                  className="tw-mt-1 tw-h-4 tw-w-4 tw-accent-primary-500"
                />
                <span>
                  {item.alt_text !== undefined && item.alt_text.length > 0
                    ? item.alt_text
                    : item.id}
                </span>
              </label>
            ))}
        </fieldset>
      ) : null}
      <StudioSelect
        label={t(locale, "profileCms.studio.width")}
        value={design.span}
        options={CMS_STUDIO_SPANS.map((value) => ({
          value,
          label: t(locale, WIDTH_LABELS[value]),
        }))}
        onChange={(value) => {
          const span = CMS_STUDIO_SPANS.find((item) => item === value);
          if (span) setDesign((current) => ({ ...current, span }));
        }}
      />
      {block.block_type === "heading" ? (
        <StudioSelect
          label={t(locale, "profileCms.studio.role")}
          value={design.role}
          options={CMS_STUDIO_ROLES.map((value) => ({
            value,
            label: t(locale, `profileCms.studio.${value}`),
          }))}
          onChange={(value) => {
            const role = CMS_STUDIO_ROLES.find((item) => item === value);
            if (role) setDesign((current) => ({ ...current, role }));
          }}
        />
      ) : null}
      <StudioButton type="submit" primary>
        {t(locale, "profileCms.studio.apply")}
      </StudioButton>
    </StudioForm>
  );
}
