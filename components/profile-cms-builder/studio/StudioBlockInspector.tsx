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
  const originalFields = block as CmsBlockV1 & Record<string, unknown>;
  const [values, setValues] = useState<Record<string, string>>({});
  const [assetId, setAssetId] = useState(getString(block, "asset_id") ?? "");
  const [assetIdChanged, setAssetIdChanged] = useState(false);
  const asset = document.payload.assets.find((item) => item.id === assetId);
  const [assetChanges, setAssetChanges] = useState<{
    alt_text?: string;
    rights?: string;
  }>({});
  const [destination, setDestination] = useState(
    getString(block, "page_id") ?? "external"
  );
  const [href, setHref] = useState(
    getString(block, "href") ?? getString(block, "url") ?? ""
  );
  const [linkChanged, setLinkChanged] = useState(false);
  const [designChanges, setDesignChanges] = useState<
    Partial<ReturnType<typeof getCmsStudioBlockPresentation>>
  >({});
  const presentation = originalFields["presentation"];
  const presentationRecord = getEditablePresentation(presentation);
  const unsupportedLinkFields = ["page_id", "href", "url"].filter(
    (key) => !isOptionalString(originalFields[key])
  );
  const galleryValue = originalFields["asset_ids"];
  const [galleryChanged, setGalleryChanged] = useState(false);
  const [galleryIds, setGalleryIds] = useState<string[]>(() => {
    const ids = (block as CmsBlockV1 & Record<string, unknown>)["asset_ids"];
    return Array.isArray(ids)
      ? ids.filter((id): id is string => typeof id === "string")
      : [];
  });
  const media = ["image", "video", "audio"].includes(block.block_type);
  const submit = () => {
    const patch: Record<string, unknown> = { ...values };
    if (Object.keys(designChanges).length > 0)
      patch["presentation"] = { ...presentationRecord, ...designChanges };
    const removeFields: string[] = [];
    if (assetIdChanged && assetId) patch["asset_id"] = assetId;
    if (galleryChanged) patch["asset_ids"] = galleryIds;
    if (linkChanged) {
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
    if (asset && Object.keys(assetChanges).length > 0)
      operations.push({
        type: "update_asset",
        assetId: asset.id,
        patch: assetChanges,
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
      {fields.map((field) => {
        const original = (block as CmsBlockV1 & Record<string, unknown>)[
          field.key
        ];
        const fieldLabel = t(locale, field.label);
        if (original !== undefined && typeof original !== "string")
          return (
            <ImportedFieldPreview
              key={field.key}
              label={fieldLabel}
              value={original}
              locale={locale}
            />
          );
        return (
          <StudioField
            key={field.key}
            label={fieldLabel}
            value={values[field.key] ?? original ?? ""}
            onChange={(value) =>
              setValues((current) => ({ ...current, [field.key]: value }))
            }
            multiline={field.multiline}
          />
        );
      })}
      {media && isOptionalString(originalFields["asset_id"]) ? (
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
              setAssetIdChanged(true);
              setAssetChanges({});
            }}
          />
          <StudioField
            label={t(locale, "profileCms.studio.altText")}
            value={assetChanges.alt_text ?? asset?.alt_text ?? ""}
            onChange={(value) =>
              setAssetChanges((current) => ({ ...current, alt_text: value }))
            }
            multiline
          />
          <StudioField
            label={t(locale, "profileCms.studio.rights")}
            value={assetChanges.rights ?? asset?.rights ?? ""}
            onChange={(value) =>
              setAssetChanges((current) => ({ ...current, rights: value }))
            }
          />
        </>
      ) : null}
      {media && !isOptionalString(originalFields["asset_id"]) ? (
        <ImportedFieldPreview
          label={t(locale, "profileCms.studio.imageSource")}
          value={originalFields["asset_id"]}
          locale={locale}
        />
      ) : null}
      {block.block_type === "button_link" &&
      unsupportedLinkFields.length > 0 ? (
        <ImportedFieldPreview
          label={t(locale, "profileCms.studio.destination")}
          value={Object.fromEntries(
            ["page_id", "href", "url"]
              .filter((key) => originalFields[key] !== undefined)
              .map((key) => [key, originalFields[key]])
          )}
          locale={locale}
        />
      ) : null}
      {block.block_type === "button_link" &&
      unsupportedLinkFields.length === 0 ? (
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
            onChange={(value) => {
              setDestination(value);
              setLinkChanged(true);
            }}
          />
          {destination === "external" ? (
            <StudioField
              label={t(locale, "profileCms.studio.linkUrl")}
              value={href}
              onChange={(value) => {
                setHref(value);
                setLinkChanged(true);
              }}
            />
          ) : null}
        </>
      ) : null}
      {block.block_type === "gallery" ? (
        <BlockGalleryFields
          document={document}
          value={galleryValue}
          galleryIds={galleryIds}
          locale={locale}
          onChange={(ids) => {
            setGalleryChanged(true);
            setGalleryIds(ids);
          }}
        />
      ) : null}
      <BlockPresentationFields
        block={block}
        changes={designChanges}
        locale={locale}
        onChange={(change) =>
          setDesignChanges((current) => ({ ...current, ...change }))
        }
      />
      <StudioButton type="submit" primary>
        {t(locale, "profileCms.studio.apply")}
      </StudioButton>
    </StudioForm>
  );
}

function BlockGalleryFields({
  document,
  value,
  galleryIds,
  locale,
  onChange,
}: {
  readonly document: CmsPackageV1;
  readonly value: unknown;
  readonly galleryIds: readonly string[];
  readonly locale: SupportedLocale;
  readonly onChange: (ids: string[]) => void;
}) {
  if (!isEditableGallery(value))
    return (
      <ImportedFieldPreview
        label={t(locale, "profileCms.studio.selectImages")}
        value={value}
        locale={locale}
      />
    );
  return (
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
              onChange={(event) => {
                onChange(
                  event.target.checked
                    ? [...galleryIds, item.id]
                    : galleryIds.filter((id) => id !== item.id)
                );
              }}
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
  );
}

function BlockPresentationFields({
  block,
  changes,
  locale,
  onChange,
}: {
  readonly block: CmsBlockV1;
  readonly changes: Partial<ReturnType<typeof getCmsStudioBlockPresentation>>;
  readonly locale: SupportedLocale;
  readonly onChange: (
    change: Partial<ReturnType<typeof getCmsStudioBlockPresentation>>
  ) => void;
}) {
  const presentation = (block as CmsBlockV1 & Record<string, unknown>)[
    "presentation"
  ];
  const presentationRecord = getEditablePresentation(presentation);
  const design = { ...getCmsStudioBlockPresentation(block), ...changes };
  return (
    <>
      {presentationRecord &&
      isEditableChoice(presentationRecord["span"], CMS_STUDIO_SPANS) ? (
        <StudioSelect
          label={t(locale, "profileCms.studio.width")}
          value={design.span}
          options={CMS_STUDIO_SPANS.map((value) => ({
            value,
            label: t(locale, WIDTH_LABELS[value]),
          }))}
          onChange={(value) => {
            const span = CMS_STUDIO_SPANS.find((item) => item === value);
            if (span) onChange({ span });
          }}
        />
      ) : (
        <ImportedFieldPreview
          label={t(locale, "profileCms.studio.width")}
          value={presentationRecord ? presentationRecord["span"] : presentation}
          locale={locale}
        />
      )}
      {block.block_type === "heading" &&
      presentationRecord &&
      isEditableChoice(presentationRecord["role"], CMS_STUDIO_ROLES) ? (
        <StudioSelect
          label={t(locale, "profileCms.studio.role")}
          value={design.role}
          options={CMS_STUDIO_ROLES.map((value) => ({
            value,
            label: t(locale, `profileCms.studio.${value}`),
          }))}
          onChange={(value) => {
            const role = CMS_STUDIO_ROLES.find((item) => item === value);
            if (role) onChange({ role });
          }}
        />
      ) : null}
      {block.block_type === "heading" &&
      presentationRecord &&
      !isEditableChoice(presentationRecord["role"], CMS_STUDIO_ROLES) ? (
        <ImportedFieldPreview
          label={t(locale, "profileCms.studio.role")}
          value={presentationRecord["role"]}
          locale={locale}
        />
      ) : null}
    </>
  );
}

function isEditableGallery(value: unknown): boolean {
  return (
    value === undefined ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"))
  );
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function getEditablePresentation(
  value: unknown
): Record<string, unknown> | null {
  if (value === undefined) return {};
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function isEditableChoice(value: unknown, choices: readonly string[]): boolean {
  return value === undefined || choices.some((choice) => choice === value);
}

function ImportedFieldPreview({
  label,
  value,
  locale,
}: {
  readonly label: string;
  readonly value: unknown;
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="tw-space-y-2">
      <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-iron-300">
        {label}
      </p>
      <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-300">
        {t(locale, "profileCms.studio.importedValueReadOnly")}
      </p>
      <details className="tw-min-w-0 tw-text-xs tw-text-iron-200">
        <summary className="tw-cursor-pointer focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
          {t(locale, "profileCms.studio.viewImportedValue")}
        </summary>
        <pre className="tw-max-h-64 tw-overflow-auto tw-whitespace-pre-wrap tw-break-words tw-rounded-lg tw-bg-iron-950 tw-p-3">
          {JSON.stringify(value, null, 2)}
        </pre>
      </details>
    </div>
  );
}
