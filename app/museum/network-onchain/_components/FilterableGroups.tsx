"use client";

import Link from "next/link";
import {
  useDeferredValue,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  VerifiedImage,
  type VerifiedImageCopy,
  type VerifiedImageDerivative,
} from "./VerifiedImage";

export interface FilterableItem {
  readonly key: string;
  readonly href: string;
  readonly label: string;
  /** Shown under the label, for example the record a short text belongs to. */
  readonly secondary?: string | undefined;
  /** Shown only for records that are not verified. */
  readonly badge?:
    | { readonly label: string; readonly tone: string }
    | undefined;
  /** A verified presentation image, shown in card groups. */
  readonly image?:
    | {
        readonly derivatives: readonly VerifiedImageDerivative[];
        readonly alt: string;
      }
    | undefined;
}

export interface FilterableGroup {
  readonly key: string;
  readonly anchor: string;
  readonly heading: string;
  readonly kicker?: string | undefined;
  readonly headingHref?: string | undefined;
  /** Cards show each item's image above its title. */
  readonly layout?: "list" | "cards" | undefined;
  /** In a card group: the sentence above items that have no image. */
  readonly noImageNote?: string | undefined;
  /** Collapsed behind "Show all" until the filter is used. */
  readonly collapsed?: boolean | undefined;
  readonly items: readonly FilterableItem[];
}

export interface FilterableGroupsCopy {
  readonly image: VerifiedImageCopy;
  readonly label: string;
  /** Contains {count}. */
  readonly showAll: string;
  readonly placeholder: string;
  readonly empty: string;
  /** Contains {shown} and {total}. */
  readonly count: string;
}

const LINK =
  "tw-break-words tw-text-base tw-text-primary-300 tw-no-underline hover:tw-text-primary-200 hover:tw-underline focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

function normalize(value: string): string {
  return value.toLocaleLowerCase().normalize("NFKD").replaceAll(/\p{M}/gu, "");
}

function Badge({ item }: Readonly<{ item: FilterableItem }>) {
  return item.badge === undefined ? null : (
    <span
      className={`tw-inline-flex tw-shrink-0 tw-items-center tw-whitespace-nowrap tw-rounded-md tw-border tw-border-solid tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium ${item.badge.tone}`}
    >
      {item.badge.label}
    </span>
  );
}

function ListRow({ item }: Readonly<{ item: FilterableItem }>) {
  return (
    <li className="tw-flex tw-min-w-0 tw-items-baseline tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-2.5">
      <span className="tw-min-w-0">
        <Link href={item.href} className={LINK}>
          {item.label}
        </Link>
        {item.secondary === undefined ? null : (
          <span className="tw-mt-0.5 tw-block tw-text-sm tw-text-iron-400">
            {item.secondary}
          </span>
        )}
      </span>
      <Badge item={item} />
    </li>
  );
}

function CardRow({
  item,
  image,
  copy,
}: Readonly<{
  item: FilterableItem;
  image: NonNullable<FilterableItem["image"]>;
  copy: FilterableGroupsCopy;
}>) {
  return (
    <li className="tw-mb-6 tw-min-w-0 tw-break-inside-avoid">
      <VerifiedImage
        derivatives={image.derivatives}
        alt={image.alt}
        copy={copy.image}
      />
      <div className="tw-mt-2 tw-flex tw-items-start tw-justify-between tw-gap-2">
        <span className="tw-min-w-0">
          <Link href={item.href} className={`tw-text-sm ${LINK}`}>
            {item.label}
          </Link>
          {item.secondary === undefined ? null : (
            <span className="tw-mt-0.5 tw-block tw-text-xs tw-leading-5 tw-text-iron-400">
              {item.secondary}
            </span>
          )}
        </span>
        <Badge item={item} />
      </div>
    </li>
  );
}

/** A card group: works with images as a grid, the rest as a short list. */
function CardGroup({
  group,
  copy,
}: Readonly<{ group: FilterableGroup; copy: FilterableGroupsCopy }>) {
  const withImages = group.items.flatMap((item) =>
    item.image === undefined ? [] : [{ item, image: item.image }]
  );
  const without = group.items.filter((item) => item.image === undefined);
  return (
    <>
      {withImages.length === 0 ? null : (
        <ul
          aria-labelledby={group.anchor}
          className="tw-m-0 tw-list-none tw-columns-1 tw-gap-x-4 tw-p-0 min-[480px]:tw-columns-2 sm:tw-columns-3 lg:tw-columns-4"
        >
          {withImages.map(({ item, image }) => (
            <CardRow key={item.key} item={item} image={image} copy={copy} />
          ))}
        </ul>
      )}
      {without.length === 0 ? null : (
        <div className="tw-mt-6">
          {group.noImageNote === undefined ? null : (
            <p className="tw-m-0 tw-mb-2 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400">
              {group.noImageNote}
            </p>
          )}
          <ul
            aria-labelledby={group.anchor}
            className="tw-m-0 tw-grid tw-list-none tw-gap-x-8 tw-p-0 md:tw-grid-cols-2"
          >
            {without.map((item) => (
              <ListRow key={item.key} item={item} />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function GroupItems({
  group,
  copy,
  filtering,
}: Readonly<{
  group: FilterableGroup;
  copy: FilterableGroupsCopy;
  filtering: boolean;
}>) {
  if (group.layout === "cards") return <CardGroup group={group} copy={copy} />;
  const list = (
    <ul
      aria-labelledby={group.anchor}
      className="tw-m-0 tw-grid tw-list-none tw-gap-x-8 tw-p-0 md:tw-grid-cols-2"
    >
      {group.items.map((item) => (
        <ListRow key={item.key} item={item} />
      ))}
    </ul>
  );
  if (group.collapsed !== true || filtering) return list;
  return (
    <details>
      <summary className="tw-cursor-pointer tw-text-sm tw-text-primary-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
        {copy.showAll.replace("{count}", String(group.items.length))}
      </summary>
      <div className="tw-mt-3">{list}</div>
    </details>
  );
}

/**
 * Grouped record lists with a title filter. The groups arrive fully rendered
 * from the server; the filter only hides rows, so the page works without
 * script.
 */
export function FilterableGroups({
  groups,
  copy,
  headingLevel = 3,
  afterFilter,
  backLink,
}: Readonly<{
  groups: readonly FilterableGroup[];
  copy: FilterableGroupsCopy;
  headingLevel?: 2 | 3;
  /** Rendered between the filter and the groups, such as a jump row. */
  afterFilter?: ReactNode;
  /** A link after each group back to the page's section list. */
  backLink?: { readonly href: string; readonly label: string };
}>) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const needle = normalize(deferred.trim());
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  const filtered = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        items:
          needle === ""
            ? group.items
            : group.items.filter((item) =>
                normalize(`${item.label} ${item.secondary ?? ""}`).includes(
                  needle
                )
              ),
      })),
    [groups, needle]
  );
  const visible = filtered.filter((group) => group.items.length > 0);
  const shown = visible.reduce((sum, group) => sum + group.items.length, 0);
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <div>
      <div className="tw-mb-6 tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-gap-4">
        <label
          htmlFor={inputId}
          className="tw-text-sm tw-font-medium tw-text-iron-300"
        >
          {copy.label}
        </label>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.placeholder}
          className="tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-base tw-text-iron-50 placeholder:tw-text-iron-500 focus:tw-border-primary-400 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 sm:tw-max-w-sm"
        />
        <p aria-live="polite" className="tw-m-0 tw-text-sm tw-text-iron-400">
          {needle === ""
            ? null
            : copy.count
                .replace("{shown}", String(shown))
                .replace("{total}", String(total))}
        </p>
      </div>
      {afterFilter}
      {shown === 0 ? (
        <p className="tw-m-0 tw-text-base tw-text-iron-300">{copy.empty}</p>
      ) : null}
      {visible.map((group, index) => (
        <section
          key={group.key}
          aria-labelledby={group.anchor}
          className="tw-mb-10 tw-scroll-mt-24"
          id={`${group.anchor}-section`}
        >
          {group.kicker === undefined ||
          visible[index - 1]?.kicker === group.kicker ? null : (
            <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-400">
              {group.kicker}
            </p>
          )}
          <Heading
            id={group.anchor}
            className="tw-m-0 tw-mb-3 tw-mt-1 tw-scroll-mt-24 tw-break-words tw-text-xl tw-font-semibold tw-text-iron-50"
          >
            {group.headingHref === undefined ? (
              group.heading
            ) : (
              <Link href={group.headingHref} className={LINK}>
                {group.heading}
              </Link>
            )}{" "}
            <span className="tw-text-sm tw-font-normal tw-text-iron-400">
              ({group.items.length})
            </span>
          </Heading>
          <GroupItems group={group} copy={copy} filtering={needle !== ""} />
          {backLink === undefined ? null : (
            <p className="tw-m-0 tw-mt-3 tw-text-sm">
              <a href={backLink.href} className={LINK}>
                {backLink.label}
              </a>
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
