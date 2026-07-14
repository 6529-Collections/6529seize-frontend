import type { CmsNavigationItemV1 } from "@/lib/profile-cms/protocol/v1";
import { getNavigationHref } from "@/components/profile-cms/site-renderer/data";
import { CmsLink } from "@/components/profile-cms/site-renderer/links";
import type { RendererContext } from "@/components/profile-cms/site-renderer/types";

export function NavigationItem({
  item,
  context,
}: {
  readonly item: CmsNavigationItemV1;
  readonly context: RendererContext;
}) {
  const href = getNavigationHref(item, context);
  const label = (
    <span className="tw-inline-flex tw-min-h-10 tw-items-center tw-border tw-border-solid tw-border-iron-700 tw-bg-black tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-200 tw-transition hover:tw-border-primary-400 hover:tw-text-white">
      {item.label}
    </span>
  );

  return (
    <li>
      {href ? (
        <CmsLink href={href}>{label}</CmsLink>
      ) : (
        <span aria-disabled="true">{label}</span>
      )}
      {item.children?.length ? (
        <ul className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2">
          {item.children.map((child) => (
            <NavigationItem
              key={`${child.label}-${child.page_id ?? child.url ?? "group"}`}
              item={child}
              context={context}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
