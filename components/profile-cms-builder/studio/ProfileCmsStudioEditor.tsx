import { useImperativeHandle, useRef, useState, type Ref } from "react";

import CmsSiteRenderer from "@/components/profile-cms/CmsSiteRenderer";
import { getString } from "@/components/profile-cms/site-renderer/data";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  CmsBlockV1,
  CmsPackageV1,
  CmsPageV1,
} from "@/lib/profile-cms/protocol/v1";
import {
  applyCmsDocumentOperation,
  type CmsDocumentOperation,
} from "@/lib/profile-cms/studio/document";
import { getCmsPublicPagePath } from "@/lib/profile-cms/runtime/routes";
import StudioBlockInspector, {
  createStudioBlock,
  getStudioBlockLabel,
  STUDIO_BLOCK_LABELS,
} from "./StudioBlockInspector";
import { StudioButton } from "./StudioControls";
import StudioDesignPanel from "./StudioDesignPanel";
import StudioPageSettings, {
  collectPageNavigationPaths,
  createStudioPage,
  getStudioPageSlug,
  getUniqueStudioSlug,
} from "./StudioPageSettings";
import StudioTemplateLibrary from "./StudioTemplateLibrary";
import StudioImageUpload from "./StudioImageUpload";
import StudioWalletImport from "./StudioWalletImport";
import StudioPageActions from "./StudioPageActions";

type StudioPanel = "pages" | "content" | "design" | "artSources";
const PANELS: readonly StudioPanel[] = [
  "pages",
  "content",
  "design",
  "artSources",
];
const HISTORY_LIMIT = 12;

export interface StudioEditorHandle {
  focusPendingForm: () => void;
}

export default function ProfileCmsStudioEditor({
  document,
  locale,
  initialShowTemplates,
  canRequestSnapshot,
  canUpload,
  scopeKey,
  onChange,
  onTemplateCreated,
  onPendingChange,
  handleRef,
  onUploadBusyChange,
}: {
  readonly document: CmsPackageV1;
  readonly locale: SupportedLocale;
  readonly initialShowTemplates: boolean;
  readonly canRequestSnapshot: boolean;
  readonly canUpload: boolean;
  readonly scopeKey: string;
  readonly onChange: (document: CmsPackageV1) => void;
  readonly onTemplateCreated: () => void;
  readonly onPendingChange: (pending: boolean) => void;
  readonly handleRef?: Ref<StudioEditorHandle>;
  readonly onUploadBusyChange: (busy: boolean) => void;
}) {
  const [showTemplates, setShowTemplates] = useState(initialShowTemplates);
  const [panel, setPanel] = useState<StudioPanel>("pages");
  const [pageId, setPageId] = useState(document.payload.pages[0]?.id ?? "");
  const [blockId, setBlockId] = useState<string | null>(null);
  const [phone, setPhone] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const uploadBusyRef = useRef(false);
  const [formRevision, setFormRevision] = useState(0);
  const formRegion = useRef<HTMLDivElement>(null);
  const focusPendingForm = () => {
    const form = formRegion.current?.querySelector(
      '[data-studio-pending="true"]'
    );
    (
      form?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      form?.querySelector<HTMLElement>("input,textarea,select")
    )?.focus();
  };
  useImperativeHandle(handleRef, () => ({ focusPendingForm }));
  const changePending = (value: boolean) => {
    pendingRef.current = value;
    setPending(value);
    onPendingChange(value);
  };
  const guard = () => {
    if (uploadBusyRef.current) {
      setError(t(locale, "profileCms.studio.pendingUpload"));
      return false;
    }
    if (!pendingRef.current) return true;
    setError(t(locale, "profileCms.studio.pendingForm"));
    focusPendingForm();
    return false;
  };
  const formState = {
    pending,
    onPendingChange: changePending,
    onDiscard: () => {
      changePending(false);
      setFormRevision((value) => value + 1);
      setError("");
    },
  };
  const [history, setHistory] = useState<{
    past: CmsPackageV1[];
    future: CmsPackageV1[];
  }>({
    past: [],
    future: [],
  });
  const page =
    document.payload.pages.find((item) => item.id === pageId) ??
    document.payload.pages[0];
  const block = page?.blocks.find((item) => item.id === blockId);
  const navigate = (id: string) => {
    if (!guard()) return;
    setPageId(id);
    setBlockId(null);
    setError("");
  };
  const commit = (next: CmsPackageV1) => {
    setHistory((current) => ({
      past: [...current.past, document].slice(-HISTORY_LIMIT),
      future: [],
    }));
    onChange(next);
  };
  const operate = (
    operation: CmsDocumentOperation,
    formApply = false
  ): boolean => {
    if (!formApply && !guard()) return false;
    const result = applyCmsDocumentOperation(
      document,
      document.integrity.package_hash,
      operation
    );
    if (!result.ok) {
      const code = result.error.code;
      let message = t(locale, "profileCms.studio.operationFailed");
      if (code.includes("referenc"))
        message = t(locale, "profileCms.studio.deleteReferenced");
      if (code === "document.stale_base")
        message = t(locale, "profileCms.studio.stale");
      setError(message);
      return false;
    }
    setError("");
    changePending(false);
    commit(result.document);
    return true;
  };
  const applyForm = (operation: CmsDocumentOperation) =>
    operate(operation, true);
  const undo = () => {
    if (!guard()) return;
    const previous = history.past.at(-1);
    if (!previous) return;
    setHistory((current) => ({
      past: current.past.slice(0, -1),
      future: [...current.future, document],
    }));
    onChange(previous);
    setError("");
  };
  const redo = () => {
    if (!guard()) return;
    const next = history.future.at(-1);
    if (!next) return;
    setHistory((current) => ({
      past: [...current.past, document],
      future: current.future.slice(0, -1),
    }));
    onChange(next);
    setError("");
  };
  const addPage = () => {
    const nextPage = createStudioPage(
      document,
      t(locale, "profileCms.studio.newPage")
    );
    if (
      operate({
        type: "batch",
        operations: [
          { type: "create_page", page: nextPage },
          {
            type: "add_navigation_item",
            navigationId: document.site.navigation_id,
            item: { label: nextPage.metadata.title, page_id: nextPage.id },
          },
        ],
      })
    )
      navigate(nextPage.id);
  };
  const duplicatePage = () => {
    if (!page) return;
    const slug = getUniqueStudioSlug(
      document,
      `${getStudioPageSlug(page).slice(0, 65)}-copy`
    );
    const newPageId = `page-${globalThis.crypto.randomUUID()}`;
    if (
      operate({
        type: "batch",
        operations: [
          {
            type: "duplicate_page",
            pageId: page.id,
            newPageId,
            path: `/${document.profile.handle}/${slug}/index.html`,
            canonicalUrl: `https://6529.io/${document.profile.handle}/${slug}`,
          },
          {
            type: "add_navigation_item",
            navigationId: document.site.navigation_id,
            item: {
              label: page.metadata.navigation_label ?? page.metadata.title,
              page_id: newPageId,
            },
          },
        ],
      })
    )
      navigate(newPageId);
  };
  const deletePage = () => {
    if (!guard() || !page || !confirmRemoval(locale)) return;
    const operations: CmsDocumentOperation[] = [];
    for (const navigation of document.payload.navigation) {
      // Remove the user's explicit page links from the end so sibling paths stay stable.
      const paths = collectPageNavigationPaths(
        navigation.items,
        page.id
      ).reverse();
      for (const itemPath of paths)
        operations.push({
          type: "remove_navigation_item",
          navigationId: navigation.id,
          itemPath,
        });
    }
    operations.push({ type: "delete_page", pageId: page.id });
    if (operate({ type: "batch", operations })) setBlockId(null);
  };
  const addBlock = (kind: keyof typeof STUDIO_BLOCK_LABELS) => {
    if (!guard() || !page) return;
    const next = createStudioBlock(kind, locale);
    if (["image", "video", "audio"].includes(kind)) {
      const asset = document.payload.assets.find((item) => item.kind === kind);
      if (!asset) {
        setError(t(locale, "profileCms.studio.addMediaFirst"));
        setPanel("artSources");
        return;
      }
      next["asset_id"] = asset.id;
    }
    if (operate({ type: "add_block", pageId: page.id, block: next })) {
      setBlockId(next.id);
      setPanel("content");
    }
  };

  const renderInspector = () => (
    <div ref={formRegion} className="tw-space-y-6 tw-p-4">
      {panel === "pages" ? (
        <>
          <ul className="tw-m-0 tw-list-none tw-space-y-2 tw-p-0">
            {document.payload.pages.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={page?.id === item.id ? "page" : undefined}
                  onClick={() => navigate(item.id)}
                  className={`tw-w-full tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-3 tw-text-left tw-text-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${page?.id === item.id ? "tw-border-primary-500 tw-bg-primary-500/10 tw-text-white" : "tw-border-transparent tw-bg-iron-950 tw-text-iron-300 hover:tw-bg-iron-800"}`}
                >
                  {item.metadata.navigation_label ?? item.metadata.title}
                </button>
              </li>
            ))}
          </ul>
          <StudioButton onClick={addPage}>
            ＋ {t(locale, "profileCms.studio.addPage")}
          </StudioButton>
          {page ? (
            <>
              <div className="tw-flex tw-flex-wrap tw-gap-2">
                <StudioButton onClick={duplicatePage}>
                  {t(locale, "profileCms.studio.duplicate")}
                </StudioButton>
                <StudioButton
                  onClick={deletePage}
                  disabled={document.payload.pages.length < 2}
                >
                  {t(locale, "profileCms.studio.remove")}
                </StudioButton>
              </div>
              <StudioPageActions
                document={document}
                page={page}
                locale={locale}
                onOperation={operate}
              />
              <StudioPageSettings
                key={`${page.id}-${document.integrity.package_hash}-${formRevision}`}
                document={document}
                page={page}
                locale={locale}
                onOperation={applyForm}
                formState={formState}
              />
            </>
          ) : null}
        </>
      ) : null}
      {panel === "content" && page ? (
        <>
          <BlockList
            page={page}
            selectedBlockId={blockId}
            locale={locale}
            onSelect={(id) => {
              if (id === blockId || guard()) setBlockId(id);
            }}
          />
          {block ? (
            <>
              <BlockActions
                page={page}
                block={block}
                locale={locale}
                onOperation={operate}
                onRemove={() => setBlockId(null)}
              />
              <StudioBlockInspector
                key={`${block.id}-${document.integrity.package_hash}-${formRevision}`}
                document={document}
                page={page}
                block={block}
                locale={locale}
                onOperation={applyForm}
                formState={formState}
              />
            </>
          ) : (
            <p className="tw-text-sm tw-leading-6 tw-text-iron-400">
              {t(locale, "profileCms.studio.selectSection")}
            </p>
          )}
          <details className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-4">
            <summary className="tw-cursor-pointer tw-text-sm tw-font-medium tw-text-white">
              {t(locale, "profileCms.studio.addSection")}
            </summary>
            <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2">
              {Object.entries(STUDIO_BLOCK_LABELS)
                .filter(([kind]) => kind !== "video" && kind !== "audio")
                .map(([kind, label]) => (
                  <StudioButton
                    key={kind}
                    onClick={() =>
                      addBlock(kind as keyof typeof STUDIO_BLOCK_LABELS)
                    }
                  >
                    {t(locale, label)}
                  </StudioButton>
                ))}
            </div>
          </details>
        </>
      ) : null}
      {panel === "design" ? (
        <StudioDesignPanel
          key={`${document.integrity.package_hash}-${formRevision}`}
          document={document}
          locale={locale}
          onOperation={operate}
          onApply={applyForm}
          formState={formState}
        />
      ) : null}
      {panel === "artSources" ? (
        <>
          <StudioImageUpload
            document={document}
            locale={locale}
            canUpload={canUpload}
            scopeKey={scopeKey}
            onChange={commit}
            onBusyChange={(busy) => {
              uploadBusyRef.current = busy;
              onUploadBusyChange(busy);
            }}
          />
          <StudioWalletImport
            document={document}
            locale={locale}
            canRequestSnapshot={canRequestSnapshot}
            onChange={commit}
          />
        </>
      ) : null}
    </div>
  );

  if (showTemplates)
    return (
      <div>
        {!initialShowTemplates || history.past.length > 0 ? (
          <div className="tw-p-4">
            <StudioButton onClick={() => setShowTemplates(false)}>
              ← {t(locale, "profileCms.studio.backToEditor")}
            </StudioButton>
          </div>
        ) : null}
        <StudioTemplateLibrary
          handle={document.profile.handle}
          locale={locale}
          onUse={(next) => {
            commit(next);
            navigate(next.payload.pages[0]?.id ?? "");
            setShowTemplates(false);
            onTemplateCreated();
          }}
        />
      </div>
    );

  return (
    <div className="tw-space-y-0">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-p-3">
        <div className="tw-flex tw-flex-wrap tw-gap-2">
          <StudioButton onClick={undo} disabled={history.past.length === 0}>
            ↶ {t(locale, "profileCms.studio.undo")}
          </StudioButton>
          <StudioButton onClick={redo} disabled={history.future.length === 0}>
            ↷ {t(locale, "profileCms.studio.redo")}
          </StudioButton>
          <StudioButton
            onClick={() => {
              if (guard() && confirmNewSite(locale)) setShowTemplates(true);
            }}
          >
            {t(locale, "profileCms.studio.newSite")}
          </StudioButton>
        </div>
        <div className="tw-flex tw-flex-wrap tw-gap-2">
          <StudioButton active={!phone} onClick={() => setPhone(false)}>
            {t(locale, "profileCms.studio.desktop")}
          </StudioButton>
          <StudioButton active={phone} onClick={() => setPhone(true)}>
            {t(locale, "profileCms.studio.mobile")}
          </StudioButton>
          <StudioButton
            active={preview}
            onClick={() => {
              if (guard()) setPreview((value) => !value);
            }}
          >
            {t(
              locale,
              preview ? "profileCms.studio.edit" : "profileCms.studio.preview"
            )}
          </StudioButton>
        </div>
      </div>
      {error ? (
        <p
          role="alert"
          className="tw-m-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-error/30 tw-bg-error/10 tw-p-4 tw-text-sm tw-text-iron-100"
        >
          {error}
        </p>
      ) : null}
      <div
        className={`tw-grid tw-grid-cols-1 ${preview ? "" : "lg:tw-grid-cols-[280px_minmax(0,1fr)]"}`}
      >
        {!preview ? (
          <aside className="tw-min-w-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-black lg:tw-border-b-0 lg:tw-border-r">
            <div className="tw-flex tw-flex-wrap tw-gap-1 tw-p-3">
              {PANELS.map((item) => (
                <StudioButton
                  key={item}
                  active={panel === item}
                  onClick={() => {
                    if (item === panel || guard()) setPanel(item);
                  }}
                >
                  {t(locale, `profileCms.studio.${item}`)}
                </StudioButton>
              ))}
            </div>
            {renderInspector()}
          </aside>
        ) : null}
        <div className="tw-min-w-0 tw-bg-iron-900 tw-p-3 sm:tw-p-5">
          {page ? (
            <>
              <p className="tw-mb-3 tw-mt-0 tw-break-all tw-text-center tw-text-xs tw-text-iron-400">
                6529.io{getCmsPublicPagePath(document, page.id)}
              </p>
              <div
                className={`tw-mx-auto tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 ${phone ? "tw-max-w-[390px]" : "tw-w-full"}`}
              >
                <CmsSiteRenderer
                  cmsPackage={document}
                  page={page}
                  locale={locale}
                  editing={{
                    selectedBlockId: blockId,
                    ...(preview
                      ? {}
                      : {
                          onSelectBlock: (id: string) => {
                            if (!guard()) return;
                            setBlockId(id);
                            setPanel("content");
                          },
                        }),
                    onNavigatePage: navigate,
                  }}
                />
              </div>
            </>
          ) : (
            <p>{t(locale, "profileCms.studio.noPages")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function BlockList({
  page,
  selectedBlockId,
  locale,
  onSelect,
}: {
  readonly page: CmsPageV1;
  readonly selectedBlockId: string | null;
  readonly locale: SupportedLocale;
  readonly onSelect: (id: string) => void;
}) {
  return (
    <ul className="tw-m-0 tw-list-none tw-space-y-1 tw-p-0">
      {page.blocks.map((block) => (
        <li key={block.id}>
          <button
            type="button"
            aria-pressed={selectedBlockId === block.id}
            onClick={() => onSelect(block.id)}
            className={`tw-w-full tw-truncate tw-rounded-md tw-border-0 tw-px-3 tw-py-2 tw-text-left tw-text-xs focus-visible:tw-outline focus-visible:tw-outline-primary-400 ${selectedBlockId === block.id ? "tw-bg-iron-800 tw-text-white" : "tw-bg-iron-950 tw-text-iron-300 hover:tw-bg-iron-800"}`}
          >
            {["title", "text", "label"]
              .map((key) => getString(block, key))
              .find((text) => text !== undefined && text.length > 0) ??
              t(locale, getStudioBlockLabel(block.block_type))}
          </button>
        </li>
      ))}
    </ul>
  );
}

function BlockActions({
  page,
  block,
  locale,
  onOperation,
  onRemove,
}: {
  readonly page: CmsPageV1;
  readonly block: CmsBlockV1;
  readonly locale: SupportedLocale;
  readonly onOperation: (operation: CmsDocumentOperation) => boolean;
  readonly onRemove: () => void;
}) {
  const index = page.blocks.findIndex((item) => item.id === block.id);
  const move = (target: number) =>
    onOperation({
      type: "move_block",
      pageId: page.id,
      blockId: block.id,
      targetPageId: page.id,
      index: target,
    });
  return (
    <div className="tw-flex tw-flex-wrap tw-gap-2">
      <StudioButton
        disabled={index === 0}
        onClick={() => move(index - 1)}
        label={t(locale, "profileCms.studio.moveUp")}
      >
        ↑
      </StudioButton>
      <StudioButton
        disabled={index === page.blocks.length - 1}
        onClick={() => move(index + 1)}
        label={t(locale, "profileCms.studio.moveDown")}
      >
        ↓
      </StudioButton>
      <StudioButton
        onClick={() =>
          onOperation({
            type: "duplicate_block",
            pageId: page.id,
            blockId: block.id,
            newBlockId: `block-${globalThis.crypto.randomUUID()}`,
            index: index + 1,
          })
        }
      >
        {t(locale, "profileCms.studio.duplicate")}
      </StudioButton>
      <StudioButton
        onClick={() => {
          if (
            confirmRemoval(locale) &&
            onOperation({
              type: "remove_block",
              pageId: page.id,
              blockId: block.id,
            })
          )
            onRemove();
        }}
      >
        {t(locale, "profileCms.studio.remove")}
      </StudioButton>
    </div>
  );
}

function confirmRemoval(locale: SupportedLocale): boolean {
  // Explicitly confirm a destructive removal of the user's working document.
  // eslint-disable-next-line no-alert
  return globalThis.confirm(t(locale, "profileCms.studio.confirmRemove"));
}

function confirmNewSite(locale: SupportedLocale): boolean {
  // Replacing a template discards the current working document.
  // eslint-disable-next-line no-alert
  return globalThis.confirm(t(locale, "profileCms.studio.replaceSite"));
}
