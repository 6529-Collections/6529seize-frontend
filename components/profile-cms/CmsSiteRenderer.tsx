import type { CSSProperties } from "react";

import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CmsPackageV1, CmsPageV1 } from "@/lib/profile-cms/protocol/v1";
import { getCmsNavigationItems } from "@/lib/profile-cms/runtime/routes";
import { CmsBlock } from "@/components/profile-cms/site-renderer/blocks";
import { createRendererContext } from "@/components/profile-cms/site-renderer/data";
import { NavigationItem } from "@/components/profile-cms/site-renderer/NavigationItem";
import { getPageTypeLabel } from "@/components/profile-cms/site-renderer/nftHelpers";
import { NftDetailPage } from "@/components/profile-cms/site-renderer/NftDetailPage";

export default function CmsSiteRenderer({
  cmsPackage,
  locale = DEFAULT_LOCALE,
  page,
}: {
  readonly cmsPackage: CmsPackageV1;
  readonly locale?: SupportedLocale | undefined;
  readonly page: CmsPageV1;
}) {
  const context = createRendererContext(cmsPackage, locale);
  const navigationItems = getCmsNavigationItems(cmsPackage);
  const accentStyle = {
    "--profile-cms-accent": cmsPackage.site.theme.accent,
  } as CSSProperties;

  return (
    <div
      className="tailwind-scope tw-min-h-[100dvh] tw-bg-black tw-text-iron-100"
      style={accentStyle}
    >
      <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-iron-950/70">
        <div className="tw-mx-auto tw-flex tw-max-w-6xl tw-flex-col tw-gap-4 tw-px-4 tw-py-5 sm:tw-px-6 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between lg:tw-px-8">
          <div>
            <p className="tw-mb-1 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary-300">
              {cmsPackage.profile.handle}
            </p>
            <h1 className="tw-text-2xl tw-font-semibold tw-text-white">
              {cmsPackage.site.title}
            </h1>
          </div>
          {navigationItems.length ? (
            <nav
              aria-label={t(locale, "profileCms.nav.label", {
                siteTitle: cmsPackage.site.title,
              })}
            >
              <ul className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                {navigationItems.map((item) => (
                  <NavigationItem
                    key={`${item.label}-${item.page_id ?? item.url ?? "group"}`}
                    item={item}
                    context={context}
                  />
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </div>

      <article className="tw-mx-auto tw-flex tw-max-w-6xl tw-flex-col tw-gap-8 tw-px-4 tw-py-8 sm:tw-px-6 md:tw-py-10 lg:tw-px-8">
        <header className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-6">
          <p className="tw-mb-2 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary-300">
            {getPageTypeLabel(locale, page.type)}
          </p>
          <h2 className="tw-text-3xl tw-font-semibold tw-leading-tight tw-text-white sm:tw-text-4xl">
            {page.metadata.title}
          </h2>
          {page.metadata.description ? (
            <p className="tw-mt-3 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
              {page.metadata.description}
            </p>
          ) : null}
        </header>

        {page.type === "nft_detail" || page.type === "card_detail" ? (
          <NftDetailPage context={context} page={page} />
        ) : (
          <div className="tw-flex tw-flex-col tw-gap-7">
            {page.blocks.map((block) => (
              <CmsBlock key={block.id} block={block} context={context} />
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
