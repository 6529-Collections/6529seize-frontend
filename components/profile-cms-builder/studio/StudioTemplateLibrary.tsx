import { useMemo, useState } from "react";

import CmsSiteRenderer from "@/components/profile-cms/CmsSiteRenderer";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  cmsPackageSchema,
  type CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";
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

interface StudioTemplateLibraryProps {
  readonly handle: string;
  readonly locale: SupportedLocale;
  readonly onUse: (document: CmsPackageV1) => void;
}

export default function StudioTemplateLibrary(
  props: StudioTemplateLibraryProps
) {
  if (
    !cmsPackageSchema.shape.profile.shape.handle.safeParse(props.handle).success
  )
    return (
      <section className="tw-space-y-3 tw-p-4 sm:tw-p-8">
        <h2 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-white">
          {t(props.locale, "profileCms.studio.choose")}
        </h2>
        <p
          role="alert"
          className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300"
        >
          {t(props.locale, "profileCms.studio.invalidProfileHandle")}
        </p>
      </section>
    );
  return <AvailableTemplateLibrary {...props} />;
}

function AvailableTemplateLibrary({
  handle,
  locale,
  onUse,
}: StudioTemplateLibraryProps) {
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
      (template.family === family && template.id !== "meme-v2") ||
      (family === "memes" &&
        (template.id === "meme-v2" || template.inspiration?.kind === "meme"))
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
          <article
            key={template.id}
            className="tw-min-w-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950"
          >
            <TemplateThumbnail
              template={template}
              handle={handle}
              locale={locale}
            />
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
                {t(
                  locale,
                  `profileCms.studio.${template.id === "meme-v2" ? "memes" : template.family}`
                )}{" "}
                ·{" "}
                {t(
                  locale,
                  template.pages.length === 1
                    ? "profileCms.studio.singlePage"
                    : "profileCms.studio.pageCount",
                  {
                    count: template.pages.length,
                  }
                )}
              </p>
              <div className="tw-flex tw-flex-wrap tw-gap-2 tw-pt-3">
                <StudioButton
                  onClick={() => setSelectedId(template.id)}
                  label={t(locale, "profileCms.studio.previewTemplate", {
                    name: template.name,
                  })}
                >
                  {t(locale, "profileCms.studio.preview")}
                </StudioButton>
                <StudioButton
                  primary
                  label={t(locale, "profileCms.studio.useTemplateNamed", {
                    name: template.name,
                  })}
                  onClick={() =>
                    onUse(instantiateCmsStudioTemplate(template.id, handle))
                  }
                >
                  {t(locale, "profileCms.studio.useTemplate")}
                </StudioButton>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TemplateThumbnail({
  template,
  handle,
  locale,
}: {
  readonly template: CmsStudioTemplate;
  readonly handle: string;
  readonly locale: SupportedLocale;
}) {
  const document = useMemo(
    () => instantiateCmsStudioTemplate(template.id, handle),
    [handle, template.id]
  );
  const page = document.payload.pages[0];
  return (
    <div
      aria-hidden="true"
      inert
      className="tw-relative tw-aspect-[4/3] tw-overflow-hidden tw-bg-iron-900"
    >
      <div className="tw-pointer-events-none tw-w-[333.333%] tw-origin-top-left tw-scale-[0.3]">
        {page ? (
          <CmsSiteRenderer cmsPackage={document} page={page} locale={locale} />
        ) : null}
      </div>
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
        <StudioButton
          primary
          onClick={onUse}
          label={t(locale, "profileCms.studio.useTemplateNamed", {
            name: template.name,
          })}
        >
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
