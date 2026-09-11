import Image from "next/image";
import { useMemo, useState } from "react";

import CmsSiteRenderer from "@/components/profile-cms/CmsSiteRenderer";
import { getString } from "@/components/profile-cms/site-renderer/data";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";
import {
  DEMO_ART_ASSETS,
  getCmsStudioDemoAssetPath,
} from "@/lib/profile-cms/studio/demo-assets";
import { MEME_ART_ASSETS } from "@/lib/profile-cms/studio/meme-assets";
import { getCmsStudioMemeDisplayAsset } from "@/lib/profile-cms/studio/meme-display-assets";
import {
  CMS_STUDIO_TEMPLATES,
  instantiateCmsStudioTemplate,
} from "@/lib/profile-cms/studio/templates";
import type {
  CmsStudioTemplate,
  CmsStudioTemplateFamily,
} from "@/lib/profile-cms/studio/template-types";
import { StudioButton, StudioSelect } from "./StudioControls";

const FAMILIES: readonly (CmsStudioTemplateFamily | "all" | "memes")[] = [
  "all",
  "personal",
  "collector",
  "artist",
  "organization",
  "fund",
  "memes",
];

export default function StudioTemplateLibrary({
  handle,
  locale,
  onUse,
}: {
  readonly handle: string;
  readonly locale: SupportedLocale;
  readonly onUse: (document: CmsPackageV1) => void;
}) {
  const [family, setFamily] = useState<(typeof FAMILIES)[number]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = CMS_STUDIO_TEMPLATES.find(
    (template) => template.id === selectedId
  );
  const previewDocument = useMemo(
    () => (selected ? instantiateCmsStudioTemplate(selected.id, handle) : null),
    [handle, selected]
  );
  if (selected && previewDocument)
    return (
      <TemplatePreview
        key={selected.id}
        template={selected}
        document={previewDocument}
        locale={locale}
        onBack={() => setSelectedId(null)}
        onUse={() => onUse(previewDocument)}
      />
    );
  const templates = CMS_STUDIO_TEMPLATES.filter(
    (template) =>
      family === "all" ||
      template.family === family ||
      (family === "memes" && template.inspiration?.kind === "meme")
  );

  return (
    <section className="tw-space-y-5 tw-p-3 sm:tw-space-y-7 sm:tw-p-8">
      <header className="tw-max-w-2xl tw-space-y-3">
        <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-widest tw-text-primary-300">
          6529
        </p>
        <h2 className="tw-m-0 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-4xl">
          {t(locale, "profileCms.studio.choose")}
        </h2>
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300 sm:tw-text-base sm:tw-leading-7">
          {t(locale, "profileCms.studio.chooseDescription")}
        </p>
      </header>
      <div
        className="tw-hidden tw-flex-wrap tw-gap-2 sm:tw-flex"
        aria-label={t(locale, "profileCms.studio.templates")}
      >
        {FAMILIES.map((item) => (
          <StudioButton
            key={item}
            active={family === item}
            onClick={() => setFamily(item)}
          >
            {t(locale, `profileCms.studio.${item}`)}
          </StudioButton>
        ))}
      </div>
      <div className="sm:tw-hidden">
        <StudioSelect
          label={t(locale, "profileCms.studio.templates")}
          value={family}
          onChange={(value) => {
            const next = FAMILIES.find((item) => item === value);
            if (next) setFamily(next);
          }}
          options={FAMILIES.map((value) => ({
            value,
            label: t(locale, `profileCms.studio.${value}`),
          }))}
        />
      </div>
      <div className="tw-grid tw-grid-cols-1 tw-gap-x-6 tw-gap-y-9 md:tw-grid-cols-2 xl:tw-grid-cols-3">
        {templates.map((template) => (
          <button
            type="button"
            key={template.id}
            onClick={() => setSelectedId(template.id)}
            aria-label={t(locale, "profileCms.studio.previewTemplate", {
              name: template.name,
            })}
            className="tw-group tw-min-w-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-transparent tw-p-0 tw-text-left tw-transition-colors hover:tw-border-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-400"
          >
            <TemplateThumbnail template={template} />
            <div className="tw-space-y-2 tw-p-5">
              <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
                <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-white">
                  {template.name}
                </h3>
                <span className="tw-text-iron-400" aria-hidden="true">
                  ↗
                </span>
              </div>
              <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
                {t(
                  locale,
                  `profileCms.studio.templateDescription.${template.id}` as MessageKey
                )}
              </p>
              <p className="tw-m-0 tw-pt-1 tw-text-xs tw-text-iron-400">
                {t(locale, `profileCms.studio.${template.family}`)} ·{" "}
                {t(locale, "profileCms.studio.pageCount", {
                  count: template.pages.length,
                })}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function TemplateThumbnail({
  template,
}: {
  readonly template: CmsStudioTemplate;
}) {
  const page = template.pages[0];
  const imageBlock = page?.blocks.find((block) => block.block_type === "image");
  const asset = [...DEMO_ART_ASSETS, ...MEME_ART_ASSETS].find(
    (candidate) =>
      candidate.id === (imageBlock ? getString(imageBlock, "asset_id") : null)
  );
  const source = asset
    ? (getCmsStudioDemoAssetPath(asset) ??
      getCmsStudioMemeDisplayAsset(asset)?.localPath)
    : null;
  const light = ["paper", "stone"].includes(
    template.presentation.studio_palette
  );
  const serif = template.presentation.studio_type === "serif";
  const fund = template.presentation.studio_layout === "fund";
  return (
    <div
      aria-hidden="true"
      className={`tw-relative tw-h-64 tw-overflow-hidden tw-p-6 ${light ? "tw-bg-[#f5f3ed] tw-text-[#242420]" : "tw-bg-[#101820] tw-text-[#eeeee8]"}`}
    >
      <div className="tw-border-current/20 tw-mb-7 tw-flex tw-items-center tw-justify-between tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-pb-3">
        <span className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-widest">
          {template.name}
        </span>
        <div className="tw-flex tw-gap-2">
          <span className="tw-h-px tw-w-5 tw-bg-current" />
          <span className="tw-h-px tw-w-5 tw-bg-current" />
        </div>
      </div>
      <div
        className={
          source && !fund
            ? "tw-grid tw-grid-cols-2 tw-items-start tw-gap-4"
            : "tw-max-w-[85%]"
        }
      >
        <div>
          <p
            className={`tw-m-0 tw-text-2xl tw-leading-[1.12] tw-tracking-tight ${serif ? "tw-font-serif" : "tw-font-semibold"}`}
          >
            {page?.title}
          </p>
          <div className="tw-mt-5 tw-space-y-2">
            <div className="tw-h-px tw-w-full tw-bg-current tw-opacity-30" />
            <div className="tw-h-px tw-w-3/4 tw-bg-current tw-opacity-30" />
            <div className="tw-h-px tw-w-1/2 tw-bg-current tw-opacity-30" />
          </div>
        </div>
        {source && asset && !fund ? (
          <Image
            src={source}
            width={asset.width ?? 768}
            height={asset.height ?? 768}
            alt=""
            sizes="180px"
            className="tw-h-36 tw-w-full tw-object-contain tw-transition-transform motion-safe:group-hover:tw-scale-[1.025]"
          />
        ) : null}
      </div>
      {fund ? (
        <div className="tw-mt-8 tw-grid tw-grid-cols-3 tw-gap-4">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="tw-border-current/30 tw-h-12 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TemplatePreview({
  template,
  document,
  locale,
  onBack,
  onUse,
}: {
  readonly template: CmsStudioTemplate;
  readonly document: CmsPackageV1;
  readonly locale: SupportedLocale;
  readonly onBack: () => void;
  readonly onUse: () => void;
}) {
  const [pageId, setPageId] = useState(document.payload.pages[0]?.id);
  const [phone, setPhone] = useState(false);
  const page =
    document.payload.pages.find((candidate) => candidate.id === pageId) ??
    document.payload.pages[0];
  return (
    <div className="tw-space-y-3 tw-p-3 sm:tw-space-y-5 sm:tw-p-6">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <StudioButton onClick={onBack}>
          ← {t(locale, "profileCms.studio.backToTemplates")}
        </StudioButton>
        <span className="-tw-order-1 tw-basis-full tw-text-base tw-font-semibold tw-text-white sm:tw-order-none sm:tw-basis-auto sm:tw-text-lg">
          {template.name}
        </span>
        <StudioButton primary onClick={onUse}>
          {t(locale, "profileCms.studio.useTemplate")}
        </StudioButton>
      </div>
      <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-300 sm:tw-text-sm sm:tw-leading-6">
        {t(locale, "profileCms.studio.sampleNotice")}
      </p>
      {template.inspiration ? (
        <a
          href={template.inspiration.url}
          target="_blank"
          rel="noreferrer"
          className="tw-inline-block tw-text-sm tw-text-primary-300 tw-underline tw-underline-offset-4"
        >
          {t(locale, "profileCms.studio.inspiration", {
            title: template.inspiration.title,
            artist: template.inspiration.artist,
          })}
        </a>
      ) : null}
      <div className="tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-3">
        <div className="tw-w-full sm:tw-w-64">
          <StudioSelect
            label={t(locale, "profileCms.studio.selectedPage")}
            value={page?.id ?? ""}
            onChange={setPageId}
            options={document.payload.pages.map((item) => ({
              value: item.id,
              label: item.metadata.navigation_label ?? item.metadata.title,
            }))}
          />
        </div>
        <div className="tw-hidden tw-gap-2 sm:tw-flex">
          <StudioButton active={!phone} onClick={() => setPhone(false)}>
            {t(locale, "profileCms.studio.desktop")}
          </StudioButton>
          <StudioButton active={phone} onClick={() => setPhone(true)}>
            {t(locale, "profileCms.studio.mobile")}
          </StudioButton>
        </div>
      </div>
      {page ? (
        <div
          className={`tw-mx-auto tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 ${phone ? "tw-max-w-[390px]" : "tw-w-full"}`}
        >
          <CmsSiteRenderer
            cmsPackage={document}
            page={page}
            locale={locale}
            editing={{ onNavigatePage: setPageId }}
          />
        </div>
      ) : null}
    </div>
  );
}
