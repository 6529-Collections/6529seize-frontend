import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CmsPackageV1, CmsPageV1 } from "@/lib/profile-cms/protocol/v1";
import { resolveCmsRoute } from "@/lib/profile-cms/runtime/routes";
import type { CmsDocumentOperation } from "@/lib/profile-cms/studio/document";
import { StudioButton } from "./StudioControls";

export default function StudioPageActions({
  document,
  page,
  locale,
  onOperation,
}: {
  readonly document: CmsPackageV1;
  readonly page: CmsPageV1;
  readonly locale: SupportedLocale;
  readonly onOperation: (operation: CmsDocumentOperation) => boolean;
}) {
  const home = resolveCmsRoute(document, document.site.base_path);
  const isHome = home.kind === "page" && home.page.id === page.id;
  const label = page.metadata.navigation_label;
  const navigationLabel =
    label === undefined || label === "" ? page.metadata.title : label;
  const navigation = document.payload.navigation.find(
    (item) => item.id === document.site.navigation_id
  );
  const position =
    navigation?.items.findIndex((item) => item.page_id === page.id) ?? -1;
  const move = (offset: number) => {
    if (!navigation || position < 0) return;
    const indices = navigation.items.map((_, index) => index);
    const target = position + offset;
    if (target < 0 || target >= indices.length) return;
    indices.splice(position, 1);
    indices.splice(target, 0, position);
    onOperation({
      type: "reorder_navigation",
      navigationId: navigation.id,
      parentPath: [],
      indices,
    });
  };
  return (
    <div className="tw-space-y-3">
      <StudioButton
        disabled={isHome}
        onClick={() => onOperation({ type: "set_home_page", pageId: page.id })}
      >
        {t(
          locale,
          isHome
            ? "profileCms.studio.homePage"
            : "profileCms.studio.makeHomePage"
        )}
      </StudioButton>
      {navigation ? (
        <>
          <label className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-leading-5 tw-text-iron-300">
            <input
              type="checkbox"
              checked={position >= 0}
              onChange={(event) => {
                if (event.target.checked) {
                  onOperation({
                    type: "add_navigation_item",
                    navigationId: navigation.id,
                    item: {
                      page_id: page.id,
                      label: navigationLabel,
                    },
                  });
                } else if (position >= 0) {
                  onOperation({
                    type: "remove_navigation_item",
                    navigationId: navigation.id,
                    itemPath: [position],
                  });
                }
              }}
              className="tw-h-4 tw-w-4 tw-accent-primary-500"
            />
            {t(locale, "profileCms.studio.showInMenu")}
          </label>
          {position >= 0 ? (
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              <StudioButton
                disabled={position === 0}
                onClick={() => move(-1)}
                label={t(locale, "profileCms.studio.moveMenuEarlier")}
              >
                ←
              </StudioButton>
              <StudioButton
                disabled={position === navigation.items.length - 1}
                onClick={() => move(1)}
                label={t(locale, "profileCms.studio.moveMenuLater")}
              >
                →
              </StudioButton>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
