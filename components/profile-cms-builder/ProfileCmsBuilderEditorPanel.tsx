"use client";

import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { WalletGalleryBuilderState } from "@/lib/profile-cms/builder/gallery";
import type {
  CmsBuilderBlock,
  CmsBuilderBlockKind,
  CmsBuilderState,
  CmsBuilderTemplate,
} from "@/lib/profile-cms/builder/package";

import {
  Fieldset,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/profile-cms-builder/ProfileCmsBuilderControls";
import { WalletGalleryPanel } from "@/components/profile-cms-builder/ProfileCmsBuilderGalleryPanel";

export type GallerySnapshotStatus = "idle" | "loading" | "ready" | "error";

const BLOCK_OPTIONS: ReadonlyArray<{
  readonly kind: CmsBuilderBlockKind;
  readonly labelKey: Parameters<typeof t>[1];
}> = [
  { kind: "heading", labelKey: "profileCms.builder.block.heading" },
  { kind: "rich_text", labelKey: "profileCms.builder.block.richText" },
  { kind: "button_link", labelKey: "profileCms.builder.block.buttonLink" },
  { kind: "image", labelKey: "profileCms.builder.block.image" },
  { kind: "callout", labelKey: "profileCms.builder.block.callout" },
  { kind: "quote", labelKey: "profileCms.builder.block.quote" },
  { kind: "room_viewer", labelKey: "profileCms.builder.block.roomViewer" },
];

export function EditorPanel({
  addBlock,
  gallerySnapshotError,
  gallerySnapshotStatus,
  locale,
  onRequestGallerySnapshot,
  removeBlock,
  selectTemplate,
  state,
  updateBlock,
  updateGallery,
  updateState,
}: {
  readonly addBlock: (kind: CmsBuilderBlockKind) => void;
  readonly gallerySnapshotError: string;
  readonly gallerySnapshotStatus: GallerySnapshotStatus;
  readonly locale: SupportedLocale;
  readonly onRequestGallerySnapshot: () => void;
  readonly removeBlock: (index: number) => void;
  readonly selectTemplate: (template: CmsBuilderTemplate) => void;
  readonly state: CmsBuilderState;
  readonly updateBlock: (
    index: number,
    patch: Partial<CmsBuilderBlock>
  ) => void;
  readonly updateGallery: (patch: Partial<WalletGalleryBuilderState>) => void;
  readonly updateState: (patch: Partial<CmsBuilderState>) => void;
}) {
  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-0 xl:tw-grid-cols-[280px_minmax(0,1fr)]">
      <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 xl:tw-border-b-0 xl:tw-border-r">
        <h2 className="tw-mb-3 tw-text-sm tw-font-semibold tw-uppercase tw-text-iron-300">
          {t(locale, "profileCms.builder.templates.title")}
        </h2>
        <div className="tw-flex tw-flex-col tw-gap-2">
          <button
            aria-pressed={state.template === "homepage"}
            className={`tw-border tw-border-solid tw-p-3 tw-text-left tw-text-sm tw-font-semibold ${
              state.template === "homepage"
                ? "tw-border-primary-400 tw-bg-primary-500/10 tw-text-white"
                : "tw-border-iron-800 tw-bg-black tw-text-iron-300 hover:tw-border-primary-400"
            }`}
            onClick={() => selectTemplate("homepage")}
            type="button"
          >
            {t(locale, "profileCms.builder.templates.homepage")}
          </button>
          <button
            aria-pressed={state.template === "wallet_gallery"}
            className={`tw-border tw-border-solid tw-p-3 tw-text-left tw-text-sm tw-font-semibold ${
              state.template === "wallet_gallery"
                ? "tw-border-primary-400 tw-bg-primary-500/10 tw-text-white"
                : "tw-border-iron-800 tw-bg-black tw-text-iron-300 hover:tw-border-primary-400"
            }`}
            onClick={() => selectTemplate("wallet_gallery")}
            type="button"
          >
            {t(locale, "profileCms.builder.templates.walletGallery")}
          </button>
          <button
            className="tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-3 tw-text-left tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-border-primary-400"
            onClick={() => addBlock("room_viewer")}
            type="button"
          >
            {t(locale, "profileCms.builder.templates.room")}
          </button>
        </div>
      </div>

      {state.template === "wallet_gallery" ? (
        <WalletGalleryPanel
          gallery={state.gallery}
          locale={locale}
          onRequestSnapshot={onRequestGallerySnapshot}
          snapshotError={gallerySnapshotError}
          snapshotStatus={gallerySnapshotStatus}
          updateGallery={updateGallery}
          updateState={updateState}
          state={state}
        />
      ) : (
        <div className="tw-flex tw-flex-col tw-gap-6 tw-p-4">
          <Fieldset title={t(locale, "profileCms.builder.siteSettings")}>
            <TextInput
              id="cms-builder-site-title"
              label={t(locale, "profileCms.builder.field.siteTitle")}
              onChange={(siteTitle) => updateState({ siteTitle })}
              value={state.siteTitle}
            />
            <TextArea
              id="cms-builder-site-description"
              label={t(locale, "profileCms.builder.field.siteDescription")}
              onChange={(siteDescription) => updateState({ siteDescription })}
              rows={3}
              value={state.siteDescription}
            />
            <TextInput
              id="cms-builder-theme-accent"
              label={t(locale, "profileCms.builder.field.themeAccent")}
              onChange={(themeAccent) => updateState({ themeAccent })}
              type="color"
              value={state.themeAccent}
            />
          </Fieldset>

          <Fieldset title={t(locale, "profileCms.builder.pageSettings")}>
            <TextInput
              id="cms-builder-page-title"
              label={t(locale, "profileCms.builder.field.pageTitle")}
              onChange={(pageTitle) => updateState({ pageTitle })}
              value={state.pageTitle}
            />
            <TextArea
              id="cms-builder-page-description"
              label={t(locale, "profileCms.builder.field.pageDescription")}
              onChange={(pageDescription) => updateState({ pageDescription })}
              rows={3}
              value={state.pageDescription}
            />
            <TextInput
              id="cms-builder-social-image"
              label={t(locale, "profileCms.builder.field.socialImageAsset")}
              onChange={(socialImageAssetId) =>
                updateState({ socialImageAssetId })
              }
              placeholder="asset-image-1"
              value={state.socialImageAssetId}
            />
            <TextInput
              id="cms-builder-navigation-label"
              label={t(locale, "profileCms.builder.field.navigationLabel")}
              onChange={(navigationLabel) => updateState({ navigationLabel })}
              value={state.navigationLabel}
            />
          </Fieldset>

          <Fieldset title={t(locale, "profileCms.builder.blocks.title")}>
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              {BLOCK_OPTIONS.map((option) => (
                <button
                  className="tw-min-h-10 tw-border tw-border-solid tw-border-iron-700 tw-bg-black tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-100 hover:tw-border-primary-400"
                  key={option.kind}
                  onClick={() => addBlock(option.kind)}
                  type="button"
                >
                  {t(locale, option.labelKey)}
                </button>
              ))}
            </div>
            <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-4">
              {state.blocks.map((block, index) => (
                <BlockEditor
                  block={block}
                  index={index}
                  key={block.id}
                  locale={locale}
                  onChange={(patch) => updateBlock(index, patch)}
                  onRemove={() => removeBlock(index)}
                />
              ))}
            </div>
          </Fieldset>
        </div>
      )}
    </div>
  );
}

function BlockEditor({
  block,
  index,
  locale,
  onChange,
  onRemove,
}: {
  readonly block: CmsBuilderBlock;
  readonly index: number;
  readonly locale: SupportedLocale;
  readonly onChange: (patch: Partial<CmsBuilderBlock>) => void;
  readonly onRemove: () => void;
}) {
  const fieldId = `cms-builder-block-${index}`;
  const blockLabelKey = getBlockLabelKey(block.kind);
  return (
    <section
      aria-labelledby={`${fieldId}-title`}
      className="tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-4"
      id={fieldId}
    >
      <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
        <h3
          className="tw-text-sm tw-font-semibold tw-uppercase tw-text-primary-300"
          id={`${fieldId}-title`}
        >
          {t(locale, blockLabelKey)}
        </h3>
        <button
          className="tw-min-h-9 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-iron-200 hover:tw-border-red"
          onClick={onRemove}
          type="button"
        >
          {t(locale, "profileCms.builder.block.remove")}
        </button>
      </div>

      {block.kind === "heading" ? (
        <TextInput
          id={`${fieldId}-text`}
          label={t(locale, "profileCms.builder.block.headingText")}
          onChange={(text) => onChange({ text })}
          value={block.text}
        />
      ) : null}

      {block.kind === "rich_text" ? (
        <TextArea
          id={`${fieldId}-rich-text`}
          label={t(locale, "profileCms.builder.block.body")}
          onChange={(text) => onChange({ text })}
          rows={5}
          value={block.text}
        />
      ) : null}

      {block.kind === "button_link" ? (
        <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2">
          <TextInput
            id={`${fieldId}-button-label`}
            label={t(locale, "profileCms.builder.block.buttonLabel")}
            onChange={(text) => onChange({ text })}
            value={block.text}
          />
          <TextInput
            id={`${fieldId}-button-url`}
            label={t(locale, "profileCms.builder.block.buttonUrl")}
            onChange={(url) => onChange({ url })}
            value={block.url}
          />
        </div>
      ) : null}

      {block.kind === "image" ? (
        <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2">
          <TextInput
            id={`${fieldId}-image-uri`}
            label={t(locale, "profileCms.builder.block.imageUri")}
            onChange={(assetUri) => onChange({ assetUri })}
            value={block.assetUri}
          />
          <TextInput
            id={`${fieldId}-image-alt`}
            label={t(locale, "profileCms.builder.block.imageAlt")}
            onChange={(altText) => onChange({ altText })}
            value={block.altText}
          />
          <TextInput
            id={`${fieldId}-image-caption`}
            label={t(locale, "profileCms.builder.block.caption")}
            onChange={(title) => onChange({ title })}
            value={block.title}
          />
        </div>
      ) : null}

      {block.kind === "callout" ? (
        <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2">
          <TextInput
            id={`${fieldId}-callout-tone`}
            label={t(locale, "profileCms.builder.block.tone")}
            onChange={(tone) => onChange({ tone })}
            value={block.tone}
          />
          <TextInput
            id={`${fieldId}-callout-title`}
            label={t(locale, "profileCms.builder.block.calloutTitle")}
            onChange={(title) => onChange({ title })}
            value={block.title}
          />
          <div className="md:tw-col-span-2">
            <TextArea
              id={`${fieldId}-callout-body`}
              label={t(locale, "profileCms.builder.block.body")}
              onChange={(text) => onChange({ text })}
              rows={4}
              value={block.text}
            />
          </div>
        </div>
      ) : null}

      {block.kind === "quote" ? (
        <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2">
          <div className="md:tw-col-span-2">
            <TextArea
              id={`${fieldId}-quote`}
              label={t(locale, "profileCms.builder.block.quoteText")}
              onChange={(text) => onChange({ text })}
              rows={4}
              value={block.text}
            />
          </div>
          <TextInput
            id={`${fieldId}-citation`}
            label={t(locale, "profileCms.builder.block.citation")}
            onChange={(citation) => onChange({ citation })}
            value={block.citation}
          />
        </div>
      ) : null}

      {block.kind === "room_viewer" ? (
        <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2">
          <SelectInput
            id={`${fieldId}-room-style`}
            label={t(locale, "profileCms.builder.block.roomStyle")}
            onChange={(roomStyle) =>
              onChange({
                roomStyle:
                  roomStyle === "salon" ||
                  roomStyle === "white_cube" ||
                  roomStyle === "dark_room"
                    ? roomStyle
                    : "wall",
              })
            }
            options={[
              {
                label: t(locale, "profileCms.builder.block.roomStyle.wall"),
                value: "wall",
              },
              {
                label: t(locale, "profileCms.builder.block.roomStyle.salon"),
                value: "salon",
              },
              {
                label: t(
                  locale,
                  "profileCms.builder.block.roomStyle.whiteCube"
                ),
                value: "white_cube",
              },
              {
                label: t(locale, "profileCms.builder.block.roomStyle.darkRoom"),
                value: "dark_room",
              },
            ]}
            value={block.roomStyle}
          />
          <TextInput
            id={`${fieldId}-room-title`}
            label={t(locale, "profileCms.builder.block.roomTitle")}
            onChange={(title) => onChange({ title })}
            value={block.title}
          />
          <TextInput
            id={`${fieldId}-room-image-uri`}
            label={t(locale, "profileCms.builder.block.roomImageUri")}
            onChange={(assetUri) => onChange({ assetUri })}
            value={block.assetUri}
          />
          <TextInput
            id={`${fieldId}-room-image-alt`}
            label={t(locale, "profileCms.builder.block.imageAlt")}
            onChange={(altText) => onChange({ altText })}
            value={block.altText}
          />
        </div>
      ) : null}
    </section>
  );
}

function getBlockLabelKey(
  kind: CmsBuilderBlockKind
): (typeof BLOCK_OPTIONS)[number]["labelKey"] {
  return (
    BLOCK_OPTIONS.find((option) => option.kind === kind)?.labelKey ??
    "profileCms.builder.block.heading"
  );
}
