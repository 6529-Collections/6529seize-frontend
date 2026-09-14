import { useState } from "react";

import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  CmsNavigationItemV1,
  CmsPackageV1,
  CmsPageV1,
} from "@/lib/profile-cms/protocol/v1";
import { isValidCmsPageSlug } from "@/lib/profile-cms/runtime/page-slugs";
import type { CmsDocumentOperation } from "@/lib/profile-cms/studio/document";
import { StudioButton, StudioField, StudioSelect } from "./StudioControls";
import StudioForm, { type StudioFormState } from "./StudioForm";

export function getStudioPageSlug(page: CmsPageV1): string {
  return page.path.split("/").slice(2, -1).join("/");
}

export function getUniqueStudioSlug(
  document: CmsPackageV1,
  seed: string
): string {
  const used = new Set(document.payload.pages.map(getStudioPageSlug));
  const base = isValidCmsPageSlug(seed) ? seed : "page";
  let slug = base;
  for (let suffix = 2; used.has(slug); suffix += 1) slug = `${base}-${suffix}`;
  return slug;
}

export function createStudioPage(
  document: CmsPackageV1,
  title: string
): CmsPageV1 {
  const slug = getUniqueStudioSlug(document, "page");
  return {
    id: `page-${globalThis.crypto.randomUUID()}`,
    type: "page",
    path: `/${document.profile.handle}/${slug}/index.html`,
    metadata: {
      title,
      description: "",
      canonical_url: `https://6529.io/${document.profile.handle}/${slug}`,
      locale: document.site.default_locale,
      navigation_label: title,
      robots: "index",
      search: "include",
      last_updated: new Date().toISOString(),
    },
    blocks: [],
  };
}

export default function StudioPageSettings({
  document,
  page,
  locale,
  onOperation,
  formState,
}: {
  readonly document: CmsPackageV1;
  readonly page: CmsPageV1;
  readonly locale: SupportedLocale;
  readonly onOperation: (operation: CmsDocumentOperation) => boolean;
  readonly formState: StudioFormState;
}) {
  const [title, setTitle] = useState(page.metadata.title);
  const [description, setDescription] = useState(page.metadata.description);
  const [label, setLabel] = useState(
    page.metadata.navigation_label ?? page.metadata.title
  );
  const [slug, setSlug] = useState(getStudioPageSlug(page));
  const [sharingImage, setSharingImage] = useState(
    page.metadata.social_image_asset_id ?? ""
  );
  const [searchable, setSearchable] = useState(
    page.metadata.robots !== "noindex"
  );
  const [error, setError] = useState("");
  const submit = () => {
    if (!title.trim()) {
      setError(t(locale, "profileCms.studio.fieldRequired"));
      return false;
    }
    const oldSlug = getStudioPageSlug(page);
    if (slug !== oldSlug && !isValidCmsPageSlug(slug)) {
      setError(t(locale, "profileCms.studio.invalidAddress"));
      return false;
    }
    const operations: CmsDocumentOperation[] = [
      {
        type: "update_page_metadata",
        pageId: page.id,
        patch: {
          title: title.trim(),
          description,
          navigation_label: label,
          robots: searchable ? "index" : "noindex",
          ...(sharingImage ? { social_image_asset_id: sharingImage } : {}),
        },
        removeFields: sharingImage ? [] : ["social_image_asset_id"],
      },
    ];
    if (slug !== oldSlug)
      operations.push({ type: "rename_page_route", pageId: page.id, slug });
    document.payload.navigation.forEach((navigation) =>
      collectPageNavigationPaths(navigation.items, page.id).forEach(
        (itemPath) =>
          operations.push({
            type: "update_navigation_label",
            navigationId: navigation.id,
            itemPath,
            label,
          })
      )
    );
    const applied = onOperation({ type: "batch", operations });
    if (applied) setError("");
    return applied;
  };

  return (
    <StudioForm locale={locale} state={formState} onSubmit={submit}>
      <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-white">
        {t(locale, "profileCms.studio.pageSettings")}
      </h3>
      <StudioField
        label={t(locale, "profileCms.studio.pageTitle")}
        value={title}
        onChange={setTitle}
        maxLength={160}
        invalid={!!error && !title.trim()}
      />
      <StudioField
        label={t(locale, "profileCms.studio.navigationLabel")}
        value={label}
        onChange={setLabel}
        maxLength={80}
      />
      <StudioField
        label={t(locale, "profileCms.studio.slug")}
        value={slug}
        onChange={setSlug}
        help={t(locale, "profileCms.studio.slugHelp")}
        maxLength={80}
        invalid={
          !!error &&
          slug !== getStudioPageSlug(page) &&
          !isValidCmsPageSlug(slug)
        }
      />
      <p className="tw-m-0 tw-break-all tw-text-xs tw-leading-5 tw-text-iron-400">
        6529.io/{document.profile.handle}/{slug}
      </p>
      <StudioField
        label={t(locale, "profileCms.studio.pageDescription")}
        value={description}
        onChange={setDescription}
        multiline
        maxLength={300}
      />
      {error ? (
        <p role="alert" className="tw-text-sm tw-text-error">
          {error}
        </p>
      ) : null}
      <StudioSelect
        label={t(locale, "profileCms.studio.sharingImage")}
        value={sharingImage}
        onChange={setSharingImage}
        options={[
          {
            value: "",
            label: t(locale, "profileCms.studio.automaticSharingImage"),
          },
          ...document.payload.assets
            .filter(
              (asset) => asset.kind === "image" || asset.kind === "social_image"
            )
            .map((asset) => ({
              value: asset.id,
              label:
                asset.alt_text !== undefined && asset.alt_text.length > 0
                  ? asset.alt_text
                  : asset.id,
            })),
        ]}
      />
      <label className="tw-flex tw-items-start tw-gap-3 tw-text-sm tw-leading-6 tw-text-iron-200">
        <input
          type="checkbox"
          checked={searchable}
          onChange={(event) => setSearchable(event.target.checked)}
          className="tw-mt-1 tw-h-4 tw-w-4 tw-accent-primary-500"
        />
        <span>{t(locale, "profileCms.studio.searchEngines")}</span>
      </label>
      <p className="tw-text-xs tw-leading-5 tw-text-iron-300">
        {t(locale, "profileCms.studio.searchPublic")}
      </p>
      <StudioButton type="submit" primary>
        {t(locale, "profileCms.studio.apply")}
      </StudioButton>
    </StudioForm>
  );
}

export function collectPageNavigationPaths(
  items: readonly CmsNavigationItemV1[],
  pageId: string,
  parentPath: readonly number[] = []
): number[][] {
  return items.flatMap((item, index) => {
    const path = [...parentPath, index];
    const matches = item.page_id === pageId ? [path] : [];
    return [
      ...matches,
      ...collectPageNavigationPaths(item.children ?? [], pageId, path),
    ];
  });
}
