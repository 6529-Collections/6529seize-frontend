"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

import { BuilderActionButton } from "@/components/profile-cms-builder/ProfileCmsBuilderControls";
import { isProfileCmsBuilderApiEnabledEnv } from "@/config/profileCmsBuilderEnv";
import { formatDate, formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { requestProfileCmsGallerySnapshot } from "@/lib/profile-cms/builder/api";
import {
  parseWalletGallerySources,
  type WalletGallerySnapshot,
} from "@/lib/profile-cms/builder/gallery";
import { getProfileCmsAssetProxyUrl } from "@/lib/profile-cms/runtime/mediaProxy";
import { resolveCmsUri } from "@/lib/profile-cms/runtime/uri";
import {
  addCmsStudioWalletGallery,
  CMS_STUDIO_WALLET_IMPORT_LIMIT,
} from "@/lib/profile-cms/studio/wallet-import";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";
import { getStructuredApiErrorStatus } from "@/services/api/common-api";

import { StudioButton, StudioField } from "./StudioControls";

interface StudioWalletImportProps {
  readonly document: CmsPackageV1;
  readonly locale: SupportedLocale;
  readonly canRequestSnapshot: boolean;
  readonly onChange: (document: CmsPackageV1) => void;
}

export default function StudioWalletImport(props: StudioWalletImportProps) {
  return (
    <WalletImportPanel
      key={props.document.profile.profile_id ?? props.document.profile.handle}
      {...props}
    />
  );
}

function WalletImportPanel({
  document,
  locale,
  canRequestSnapshot,
  onChange,
}: StudioWalletImportProps) {
  const id = useId();
  const [walletInput, setWalletInput] = useState("");
  const [title, setTitle] = useState(() =>
    t(locale, "profileCms.studio.wallet.defaultTitle")
  );
  const [snapshot, setSnapshot] = useState<WalletGallerySnapshot>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const requestId = useRef(0);
  const canFetch = canRequestSnapshot || !isProfileCmsBuilderApiEnabledEnv();
  useEffect(
    () => () => {
      requestId.current += 1;
    },
    []
  );

  const requestSnapshot = async () => {
    setAdded(false);
    if (!canFetch) {
      setError(t(locale, "profileCms.builder.gallery.snapshot.signInRequired"));
      return;
    }
    const sources = parseWalletGallerySources(walletInput);
    if (!sources.ok) {
      setError(
        walletInput.trim()
          ? t(locale, "profileCms.builder.gallery.wallets.invalidError", {
              entries: sources.errors.join(", "),
            })
          : t(locale, "profileCms.builder.gallery.wallets.emptyError")
      );
      return;
    }
    if (sources.sources.length > 25) {
      setError(t(locale, "profileCms.studio.wallet.tooManyWallets"));
      return;
    }
    const attempt = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const next = await requestProfileCmsGallerySnapshot({
        handle: document.profile.handle,
        sources: sources.sources,
      });
      if (attempt !== requestId.current) return;
      setSnapshot(next);
      setSelectedIds((current) =>
        current.filter((assetId) =>
          next.assets.some((asset) => asset.id === assetId)
        )
      );
    } catch (cause) {
      if (attempt !== requestId.current) return;
      setError(
        t(
          locale,
          getStructuredApiErrorStatus(cause) === 401
            ? "profileCms.builder.gallery.snapshot.sessionExpired"
            : "profileCms.builder.gallery.snapshot.failed"
        )
      );
    } finally {
      if (attempt === requestId.current) setLoading(false);
    }
  };

  const addSelection = () => {
    if (loading || !snapshot || selectedIds.length === 0) return;
    const result = addCmsStudioWalletGallery(document, {
      expectedBaseHash: document.integrity.package_hash,
      snapshot,
      selectedAssetIds: selectedIds,
      title,
      description: t(locale, "profileCms.studio.wallet.description"),
      collectionsTitle: t(locale, "profileCms.studio.wallet.collections"),
      noPreviewText: t(locale, "profileCms.studio.wallet.partial"),
      locale,
    });
    if (!result.ok) {
      setError(t(locale, "profileCms.studio.wallet.addFailed"));
      return;
    }
    onChange(result.document);
    setSelectedIds([]);
    setError("");
    setAdded(true);
  };

  const selected = selectedIds.flatMap(
    (assetId) => snapshot?.assets.filter((asset) => asset.id === assetId) ?? []
  );
  const owners = [
    ...new Set(selected.map((asset) => asset.owner.toLowerCase())),
  ];
  const descriptionIds =
    [!canFetch ? `${id}-sign-in` : "", error ? `${id}-error` : ""]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <section
      className="tw-min-w-0 tw-space-y-5"
      aria-label={t(locale, "profileCms.studio.wallet.title")}
    >
      <div className="tw-space-y-2">
        <h2 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
          {t(locale, "profileCms.studio.wallet.title")}
        </h2>
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "profileCms.studio.wallet.scope")}
        </p>
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "profileCms.studio.wallet.limits")}
        </p>
      </div>
      <fieldset
        disabled={loading}
        className="tw-m-0 tw-min-w-0 tw-space-y-4 tw-border-0 tw-p-0"
      >
        <StudioField
          label={t(locale, "profileCms.builder.gallery.wallets.label")}
          value={walletInput}
          multiline
          maxLength={2048}
          help={error || t(locale, "profileCms.builder.gallery.wallets.help")}
          onChange={(value) => {
            setWalletInput(value);
            setSnapshot(undefined);
            setSelectedIds([]);
            setAdded(false);
            setError("");
          }}
        />
        <BuilderActionButton
          describedBy={descriptionIds}
          disabled={!canFetch || loading}
          label={t(
            locale,
            loading
              ? "profileCms.builder.gallery.snapshot.loading"
              : "profileCms.builder.gallery.snapshot.request"
          )}
          onClick={() => {
            void requestSnapshot();
          }}
        />
      </fieldset>
      {!canFetch ? (
        <p
          id={`${id}-sign-in`}
          className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-200"
        >
          {t(locale, "profileCms.builder.gallery.snapshot.signInRequired")}
        </p>
      ) : null}
      {loading ? (
        <p role="status" className="tw-text-sm tw-text-iron-300">
          {t(locale, "profileCms.builder.gallery.snapshot.loadingDetail")}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          id={`${id}-error`}
          className="tw-text-red-300 tw-text-sm tw-leading-6"
        >
          {error}
        </p>
      ) : null}
      {added ? (
        <p role="status" className="tw-text-sm tw-leading-6 tw-text-iron-200">
          {t(locale, "profileCms.studio.wallet.added")}
        </p>
      ) : null}
      {snapshot ? (
        <>
          <SnapshotNotices snapshot={snapshot} locale={locale} />
          <p role="status" className="tw-text-sm tw-text-iron-200">
            {t(locale, "profileCms.studio.wallet.snapshot", {
              count: formatInteger(locale, snapshot.assets.length),
              date: formatDate(locale, snapshot.capturedAt),
            })}
          </p>
          <div
            className="tw-grid tw-grid-cols-2 tw-gap-3"
            aria-label={t(locale, "profileCms.builder.gallery.assets.title")}
          >
            {snapshot.assets.map((asset) => {
              const image = resolveCmsUri(asset.imageUri);
              const checked = selectedIds.includes(asset.id);
              return (
                <label
                  key={asset.id}
                  className={`tw-relative tw-flex tw-min-w-0 tw-cursor-pointer tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-p-2 ${checked ? "tw-bg-primary-900/30 tw-border-primary-400" : "tw-border-iron-700 tw-bg-iron-900"}`}
                >
                  {image ? (
                    <Image
                      src={getProfileCmsAssetProxyUrl(image)}
                      alt=""
                      width={asset.width ?? 300}
                      height={asset.height ?? 300}
                      unoptimized
                      className="tw-aspect-square tw-h-auto tw-w-full tw-object-contain"
                    />
                  ) : (
                    <span className="tw-flex tw-aspect-square tw-items-center tw-justify-center tw-text-xs tw-text-iron-400">
                      {t(
                        locale,
                        "profileCms.builder.gallery.assets.mediaPartial"
                      )}
                    </span>
                  )}
                  <span className="tw-flex tw-items-start tw-gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={
                        loading ||
                        asset.flags.spam ||
                        asset.flags.excluded ||
                        (!checked &&
                          selectedIds.length >= CMS_STUDIO_WALLET_IMPORT_LIMIT)
                      }
                      aria-label={t(locale, "profileCms.studio.wallet.select", {
                        title: asset.title,
                      })}
                      onChange={() => {
                        setAdded(false);
                        setSelectedIds((current) =>
                          checked
                            ? current.filter((assetId) => assetId !== asset.id)
                            : [...current, asset.id]
                        );
                      }}
                      className="tw-mt-0.5 tw-size-5 tw-shrink-0 tw-accent-primary-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                    />
                    <span className="tw-min-w-0 tw-break-words tw-text-xs tw-leading-5 tw-text-iron-100">
                      {asset.title}
                    </span>
                  </span>
                  <span className="tw-break-words tw-text-xs tw-leading-5 tw-text-iron-300">
                    {asset.collectionName}
                  </span>
                  <span className="tw-break-all tw-text-[10px] tw-leading-4 tw-text-iron-400">
                    {t(locale, "profileCms.builder.gallery.assets.owner", {
                      owner: asset.owner,
                    })}
                  </span>
                </label>
              );
            })}
          </div>
          {snapshot.assets.length === 0 ? (
            <p className="tw-text-sm tw-text-iron-300">
              {t(locale, "profileCms.builder.gallery.assets.empty")}
            </p>
          ) : null}
          <div className="tw-space-y-3">
            <h3 className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
              {t(locale, "profileCms.studio.wallet.selected")}
            </h3>
            <p className="tw-m-0 tw-text-xs tw-text-iron-300">
              {t(locale, "profileCms.studio.wallet.selection", {
                count: formatInteger(locale, selectedIds.length),
                limit: formatInteger(locale, CMS_STUDIO_WALLET_IMPORT_LIMIT),
              })}
            </p>
            <ol className="tw-m-0 tw-space-y-2 tw-pl-5">
              {selected.map((asset, index) => (
                <li key={asset.id} className="tw-text-sm tw-text-iron-200">
                  <span className="tw-break-words">{asset.title}</span>
                  <div className="tw-mt-1 tw-flex tw-flex-wrap tw-gap-2">
                    <StudioButton
                      disabled={loading || index === 0}
                      label={t(locale, "profileCms.studio.wallet.moveUp", {
                        title: asset.title,
                      })}
                      onClick={() =>
                        setSelectedIds((current) => move(current, index, -1))
                      }
                    >
                      {t(locale, "profileCms.builder.gallery.assets.moveUp")}
                    </StudioButton>
                    <StudioButton
                      disabled={loading || index === selected.length - 1}
                      label={t(locale, "profileCms.studio.wallet.moveDown", {
                        title: asset.title,
                      })}
                      onClick={() =>
                        setSelectedIds((current) => move(current, index, 1))
                      }
                    >
                      {t(locale, "profileCms.builder.gallery.assets.moveDown")}
                    </StudioButton>
                  </div>
                </li>
              ))}
            </ol>
            <StudioButton
              disabled={loading || selectedIds.length === 0}
              onClick={() => setSelectedIds([])}
            >
              {t(locale, "profileCms.studio.wallet.clear")}
            </StudioButton>
          </div>
          <p className="tw-text-xs tw-leading-5 tw-text-iron-300">
            {t(locale, "profileCms.studio.wallet.ownerDisclosure")}
          </p>
          {owners.length > 0 ? (
            <details className="tw-text-xs tw-text-iron-300">
              <summary className="tw-cursor-pointer tw-py-2">
                {t(locale, "profileCms.studio.wallet.owners")}
              </summary>
              <ul className="tw-space-y-2 tw-pl-4">
                {owners.map((owner) => (
                  <li key={owner} className="tw-break-all">
                    {owner}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          <StudioField
            label={t(locale, "profileCms.studio.wallet.galleryTitle")}
            value={title}
            maxLength={80}
            onChange={setTitle}
          />
          <StudioButton
            primary
            disabled={loading || selectedIds.length === 0 || !title.trim()}
            onClick={addSelection}
          >
            {t(locale, "profileCms.studio.wallet.add")}
          </StudioButton>
        </>
      ) : null}
    </section>
  );
}

function move(ids: string[], index: number, direction: -1 | 1): string[] {
  const result = [...ids];
  const value = result[index];
  if (!value || index + direction < 0 || index + direction >= result.length)
    return result;
  result.splice(index, 1);
  result.splice(index + direction, 0, value);
  return result;
}

function SnapshotNotices({
  snapshot,
  locale,
}: {
  readonly snapshot: WalletGallerySnapshot;
  readonly locale: SupportedLocale;
}) {
  const messages = [
    snapshot.source === "fixture"
      ? t(locale, "profileCms.studio.wallet.fixture")
      : null,
    snapshot.totals?.truncated
      ? t(locale, "profileCms.studio.wallet.truncated")
      : null,
    (snapshot.totals?.unresolvedWallets ?? 0) > 0
      ? t(locale, "profileCms.studio.wallet.unresolved")
      : null,
    snapshot.assets.some(
      (asset) =>
        asset.mediaState !== "ready" ||
        (asset.width ?? 0) <= 0 ||
        (asset.height ?? 0) <= 0
    )
      ? t(locale, "profileCms.studio.wallet.partial")
      : null,
  ].filter((message): message is string => message !== null);
  return messages.length > 0 ? (
    <ul className="tw-space-y-2 tw-pl-4 tw-text-xs tw-leading-5 tw-text-iron-300">
      {messages.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  ) : null;
}
