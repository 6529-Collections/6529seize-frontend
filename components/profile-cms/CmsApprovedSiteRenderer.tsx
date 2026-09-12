"use client";

import type { CSSProperties } from "react";

import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  CmsBlockV1,
  CmsNavigationItemV1,
  CmsPackageV1,
  CmsPageV1,
} from "@/lib/profile-cms/protocol/v1";
import {
  getCmsNavigationItems,
  resolveCmsRoute,
} from "@/lib/profile-cms/runtime/routes";
import {
  getCmsStudioBlockPresentation,
  type CmsStudioPresentation,
} from "@/lib/profile-cms/studio/presentation";
import type { CmsStudioEditingContext } from "./CmsStudioSiteRenderer";
import { createRendererContext } from "./site-renderer/data";
import type { RendererContext } from "./site-renderer/types";
import { ApprovedBlock } from "./approved-renderer/Blocks";
import {
  getApprovedAccentInk,
  getApprovedGroups,
  getApprovedSection,
} from "./approved-renderer/contract";
import { ApprovedLink } from "./approved-renderer/links";
import { ApprovedSessionProvider } from "./approved-renderer/session";
import { useBlockEditing } from "./approved-renderer/useBlockEditing";
import styles from "./approved-renderer/approved.module.css";

export default function CmsApprovedSiteRenderer({
  cmsPackage,
  page,
  locale,
  presentation,
  editing,
}: {
  readonly cmsPackage: CmsPackageV1;
  readonly page: CmsPageV1;
  readonly locale: SupportedLocale;
  readonly presentation: CmsStudioPresentation;
  readonly editing?: CmsStudioEditingContext | undefined;
}) {
  const context = createRendererContext(
    cmsPackage,
    locale,
    editing?.onNavigatePage
  );
  const resolved = resolveCmsRoute(cmsPackage, cmsPackage.site.base_path);
  const home =
    resolved.kind === "page" ? resolved.page : cmsPackage.payload.pages[0];
  const hasHero = page.blocks.some(
    (block) =>
      block.block_type === "heading" &&
      getCmsStudioBlockPresentation(block).role === "hero"
  );
  const profileHref = `/${encodeURIComponent(cmsPackage.profile.handle)}`;
  const profileLabel = t(locale, "profileCms.studio.profileLink", {
    handle: cmsPackage.profile.handle,
  });
  const sessionScope = `${cmsPackage.profile.handle.toLowerCase()}:${cmsPackage.package_id}`;
  const rootRef = useBlockEditing(!!editing?.onSelectBlock, sessionScope);
  return (
    <ApprovedSessionProvider key={sessionScope} scope={sessionScope}>
      <div
        ref={rootRef}
        className={`tailwind-scope ${styles["root"] ?? ""}`}
        data-cms-approved-design={presentation.studio_design}
        data-palette={presentation.studio_palette}
        data-typography={presentation.studio_type}
        data-density={presentation.studio_density}
        data-layout={presentation.studio_layout}
        data-editing={!!editing?.onSelectBlock}
        data-home={home?.id === page.id}
        style={
          {
            "--approved-accent": cmsPackage.site.theme.accent,
            "--approved-accent-ink": getApprovedAccentInk(
              cmsPackage.site.theme.accent
            ),
          } as CSSProperties
        }
      >
        <header className={styles["siteHeader"]}>
          <div className={styles["topline"]}>
            <ApprovedLink
              context={context}
              pageId={home?.id}
              className={styles["brand"]}
            >
              <span aria-hidden="true" className={styles["brandMark"]} />
              {cmsPackage.site.title}
            </ApprovedLink>
            <a href={profileHref} className={styles["profileLink"]}>
              {profileLabel} <span aria-hidden="true">↗</span>
            </a>
          </div>
          <nav
            className={styles["navigation"]}
            aria-label={t(locale, "profileCms.nav.label", {
              siteTitle: cmsPackage.site.title,
            })}
          >
            <ApprovedNavigation
              items={getCmsNavigationItems(cmsPackage)}
              context={context}
              pageId={page.id}
            />
          </nav>
        </header>
        <article className={styles["main"]}>
          {!hasHero ? (
            <header className={styles["pageHeading"]}>
              <h1 className={styles["heroTitle"]}>{page.metadata.title}</h1>
              {page.metadata.description ? (
                <p>{page.metadata.description}</p>
              ) : null}
            </header>
          ) : null}
          <div className={styles["content"]}>
            <ApprovedPageContent
              blocks={page.blocks}
              context={context}
              editing={editing}
              design={presentation.studio_design}
            />
          </div>
        </article>
        <footer className={styles["siteFooter"]}>
          <span>{cmsPackage.site.title}</span>
          <a href={profileHref}>{profileLabel} ↗</a>
        </footer>
      </div>
    </ApprovedSessionProvider>
  );
}

function ApprovedPageContent({
  blocks,
  context,
  editing,
  design,
}: {
  readonly blocks: readonly CmsBlockV1[];
  readonly context: RendererContext;
  readonly editing?: CmsStudioEditingContext | undefined;
  readonly design: CmsStudioPresentation["studio_design"];
}) {
  const groups = getApprovedGroups(blocks);
  const sections: {
    key: string;
    programme: boolean;
    groups: typeof groups;
  }[] = [];
  for (const group of groups) {
    const programme =
      design === "organization-v2" &&
      group.blocks.some(
        (block) => getApprovedSection(block).variant === "schedule"
      );
    const previous = sections.at(-1);
    if (programme && previous?.programme) previous.groups.push(group);
    else sections.push({ key: group.key, programme, groups: [group] });
  }
  const renderGroup = (group: (typeof groups)[number]) =>
    group.grouped ? (
      <ApprovedGroup
        key={group.key}
        blocks={group.blocks}
        groupId={group.key}
        context={context}
        editing={editing}
        design={design}
      />
    ) : (
      group.blocks.map((block) => (
        <EditableBlock
          key={block.id}
          block={block}
          context={context}
          editing={editing}
        />
      ))
    );
  return sections.map((section) =>
    section.programme ? (
      <section key={section.key} className={styles["programme"]}>
        {section.groups.map(renderGroup)}
      </section>
    ) : (
      section.groups.map(renderGroup)
    )
  );
}

function ApprovedGroup({
  blocks,
  groupId,
  context,
  editing,
  design,
}: {
  readonly blocks: readonly CmsBlockV1[];
  readonly groupId: string;
  readonly context: RendererContext;
  readonly editing?: CmsStudioEditingContext | undefined;
  readonly design: CmsStudioPresentation["studio_design"];
}) {
  const variant = blocks
    .map((block) => getApprovedSection(block).variant)
    .find(Boolean);
  const render = createBlockRenderer(context, editing);
  const media = blocks.filter((block) => block.block_type === "image");
  const copy = blocks.filter((block) => block.block_type !== "image");
  const splitHero =
    variant === "hero" &&
    ["personal-v2", "collector-v2", "artist-v2"].includes(design ?? "");
  const identity = splitHero
    ? blocks.filter((block) =>
        ["hero", "kicker"].includes(getCmsStudioBlockPresentation(block).role)
      )
    : [];
  const intro = splitHero
    ? blocks.filter((block) => !identity.includes(block))
    : [];
  const mockups =
    variant === "project"
      ? blocks.filter(
          (block) =>
            block.block_type === "callout" &&
            getCmsStudioBlockPresentation(block).role === "card"
        )
      : [];
  if (
    variant === "schedule" &&
    design === "organization-v2" &&
    blocks.some(
      (block) =>
        block.block_type === "button_link" ||
        getApprovedSection(block).variant === "note" ||
        getCmsStudioBlockPresentation(block).role === "card"
    )
  ) {
    return (
      <ApprovedScheduleGroup
        blocks={blocks}
        groupId={groupId}
        context={context}
        editing={editing}
      />
    );
  }
  if (variant === "feature" && media.length)
    return (
      <section
        className={styles["featureLayout"]}
        data-group={groupId}
        data-variant={variant}
      >
        <div className={styles["featureMedia"]}>{media.map(render)}</div>
        <div className={styles["featureCopy"]}>{copy.map(render)}</div>
      </section>
    );
  if (splitHero && identity.length && intro.length)
    return (
      <section
        className={styles["splitHero"]}
        data-group={groupId}
        data-variant={variant}
      >
        <div>{identity.map(render)}</div>
        <div>{intro.map(render)}</div>
      </section>
    );
  if (variant === "cards")
    return (
      <section
        className={styles["setCard"]}
        data-group={groupId}
        data-variant={variant}
      >
        {media.length ? (
          <div className={styles["setArt"]}>{media.map(render)}</div>
        ) : null}
        <div className={styles["setCopy"]}>{copy.map(render)}</div>
      </section>
    );
  if (variant === "project" && mockups.length)
    return (
      <section
        className={styles["projectLayout"]}
        data-group={groupId}
        data-variant={variant}
      >
        <div>
          {blocks.filter((block) => !mockups.includes(block)).map(render)}
        </div>
        <div className={styles["mockupColumn"]}>{mockups.map(render)}</div>
      </section>
    );
  return (
    <section
      className={styles["group"]}
      data-group={groupId}
      data-variant={variant}
    >
      {blocks.map(render)}
    </section>
  );
}

function ApprovedScheduleGroup({
  blocks,
  groupId,
  context,
  editing,
}: {
  readonly blocks: readonly CmsBlockV1[];
  readonly groupId: string;
  readonly context: RendererContext;
  readonly editing?: CmsStudioEditingContext | undefined;
}) {
  const dates: CmsBlockV1[] = [];
  const notes: CmsBlockV1[] = [];
  const actions: CmsBlockV1[] = [];
  const body: CmsBlockV1[] = [];
  for (const block of blocks) {
    if (getCmsStudioBlockPresentation(block).role === "kicker")
      dates.push(block);
    else if (getApprovedSection(block).variant === "note") notes.push(block);
    else if (
      block.block_type === "button_link" ||
      getCmsStudioBlockPresentation(block).role === "card"
    )
      actions.push(block);
    else body.push(block);
  }
  const render = createBlockRenderer(context, editing);
  return (
    <section
      className={styles["scheduleLayout"]}
      data-group={groupId}
      data-variant="schedule"
    >
      <div className={styles["scheduleDate"]}>{dates.map(render)}</div>
      <div className={styles["scheduleBody"]}>{body.map(render)}</div>
      <div className={styles["scheduleActions"]}>{actions.map(render)}</div>
      {notes.length > 0 ? (
        <div className={styles["scheduleNotes"]}>{notes.map(render)}</div>
      ) : null}
    </section>
  );
}

function createBlockRenderer(
  context: RendererContext,
  editing: CmsStudioEditingContext | undefined
) {
  return function renderBlock(block: CmsBlockV1) {
    return (
      <EditableBlock
        key={block.id}
        block={block}
        context={context}
        editing={editing}
      />
    );
  };
}

function EditableBlock({
  block,
  context,
  editing,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
  readonly editing?: CmsStudioEditingContext | undefined;
}) {
  const presentation = getCmsStudioBlockPresentation(block);
  const variant = getApprovedSection(block).variant;
  return (
    <section
      id={block.id}
      className={styles["block"]}
      data-cms-block-id={block.id}
      data-block-type={block.block_type}
      data-span={presentation.span}
      data-role={presentation.role}
      data-variant={variant}
      data-selected={editing?.selectedBlockId === block.id}
    >
      {editing?.onSelectBlock ? (
        <button
          type="button"
          data-cms-edit-block
          className={styles["editBlock"]}
          onClick={() => editing.onSelectBlock?.(block.id)}
          aria-pressed={editing.selectedBlockId === block.id}
        >
          {t(context.locale, "profileCms.approved.editSection")}
        </button>
      ) : null}
      <ApprovedBlock block={block} context={context} />
    </section>
  );
}

function ApprovedNavigation({
  items,
  context,
  pageId,
}: {
  readonly items: readonly CmsNavigationItemV1[];
  readonly context: RendererContext;
  readonly pageId: string;
}) {
  return (
    <ul>
      {items.map((item, index) => (
        <li
          key={`${item.label}-${index}`}
          data-current={item.page_id === pageId}
        >
          <ApprovedLink
            context={context}
            pageId={item.page_id}
            href={item.url}
            current={item.page_id === pageId}
          >
            {item.label}
          </ApprovedLink>
          {(item.children?.length ?? 0) > 0 ? (
            <ApprovedNavigation
              items={item.children ?? []}
              context={context}
              pageId={pageId}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
