"use client";

import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  CubeTransparentIcon,
  DocumentDuplicateIcon,
  PhotoIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useMemo, useState } from "react";

import { useAuth } from "@/components/auth/Auth";
import { buildCmsPackage } from "@/lib/cms/package-utils";
import {
  getCmsStudioErrorMessage,
  getOrCreateCmsSite,
  publishCmsPackage,
} from "@/lib/cms/studio-api";
import { CMS_PAYLOAD_SCHEMA, type CmsPayload } from "@/lib/cms/types";

import styles from "./ProfileCmsStudio.module.scss";

type GalleryStyle = "editorial" | "grid" | "room";
type StorageTarget = "ipfs" | "arweave" | "both";
type ProfileCmsStudioClassName =
  | "actionRow"
  | "confirmActions"
  | "confirmDialog"
  | "confirmGrid"
  | "dialogBackdrop"
  | "dialogLayer"
  | "errorList"
  | "evidence"
  | "evidenceHeader"
  | "eyebrow"
  | "header"
  | "headerMeta"
  | "miniButton"
  | "panel"
  | "previewFrame"
  | "previewGrid"
  | "publishButton"
  | "publishStatus"
  | "publishStatusError"
  | "publishStatusSuccess"
  | "routeList"
  | "secondaryAction"
  | "segmented"
  | "selectedBadge"
  | "selectedPill"
  | "selectedSegment"
  | "shell"
  | "storageButtons"
  | "storageHint"
  | "storageRow"
  | "workspace";

const DEFAULT_ADDRESS = "0x0000000000000000000000000000000000006529";
const FIXTURE_TIMESTAMP = "2026-06-16T00:00:00.000Z";
const css = styles as Readonly<Record<ProfileCmsStudioClassName, string>>;

type PublishStatus = {
  readonly type: "success" | "error";
  readonly message: string;
};

type CopiedEvidence = "package" | "payload" | null;

const styleOptions: readonly {
  readonly id: GalleryStyle;
  readonly label: string;
  readonly description: string;
  readonly icon: typeof PhotoIcon;
}[] = [
  {
    id: "editorial",
    label: "Editorial",
    description: "Large works, collection notes, and share pages.",
    icon: PhotoIcon,
  },
  {
    id: "grid",
    label: "Market Grid",
    description: "Dense collection pages for scanning and comparing.",
    icon: Squares2X2Icon,
  },
  {
    id: "room",
    label: "3D Room",
    description: "Exhibition room package with 2D fallback.",
    icon: CubeTransparentIcon,
  },
];

const storageOptions: readonly {
  readonly id: StorageTarget;
  readonly label: string;
}[] = [
  { id: "both", label: "IPFS + Arweave" },
  { id: "ipfs", label: "IPFS" },
  { id: "arweave", label: "Arweave" },
];

function parseWallets(value: string): string[] {
  return value
    .split(/[\s,]+/)
    .map((wallet) => wallet.trim())
    .filter(Boolean);
}

function getWalletErrors(wallets: readonly string[]): string[] {
  if (wallets.length === 0) {
    return ["Add at least one ETH address."];
  }
  return wallets
    .filter((wallet) => !/^0x[a-fA-F0-9]{40}$/.test(wallet))
    .map((wallet) => `${wallet} is not an ETH address.`);
}

function getProfileHandlePath(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, "") || "profile";
}

function getStorage(storageTarget: StorageTarget) {
  const ipfs = {
    provider: "ipfs" as const,
    uri: "ipfs://pending-profile-cms-package",
    pinned: false,
  };
  const arweave = {
    provider: "arweave" as const,
    uri: "ar://pending-profile-cms-package",
    pinned: false,
  };
  if (storageTarget === "ipfs") {
    return [ipfs];
  }
  if (storageTarget === "arweave") {
    return [arweave];
  }
  return [ipfs, arweave];
}

function buildStudioPayload({
  handle,
  title,
  description,
  wallets,
  galleryStyle,
}: {
  readonly handle: string;
  readonly title: string;
  readonly description: string;
  readonly wallets: readonly string[];
  readonly galleryStyle: GalleryStyle;
}): CmsPayload {
  const displayHandle = getProfileHandlePath(handle);
  const styleLabel =
    styleOptions.find((option) => option.id === galleryStyle)?.label ??
    "Gallery";
  return {
    schema: CMS_PAYLOAD_SCHEMA,
    site: {
      id: `site-${displayHandle}`,
      slug: "home",
      title: displayHandle,
      description,
      owner_profile: {
        id: `profile-${displayHandle}`,
        handle: displayHandle,
        display_name: displayHandle,
        path: `/${displayHandle}`,
      },
      theme: {
        mode: "dark",
        accent_color: galleryStyle === "room" ? "#9df871" : "#36d1dc",
      },
    },
    page: {
      id: "page-home",
      title,
      description,
      slug_path: "",
      static_export_path: `/${displayHandle}/index.html`,
      canonical_url: `https://6529.io/${displayHandle}/index.html`,
      page_type: "gallery",
      social: {
        title,
        description,
        canonical_url: `https://6529.io/${displayHandle}/index.html`,
        open_graph_image: {
          url: "/memes-preview.png",
          width: 1200,
          height: 630,
          alt: `${title} social preview`,
        },
      },
      created_at: FIXTURE_TIMESTAMP,
      updated_at: FIXTURE_TIMESTAMP,
    },
    assets: [
      {
        id: "asset-memes",
        kind: "image",
        src: "/memes-preview.png",
        alt: "The Memes collection preview",
        title: "The Memes",
        width: 1200,
        height: 630,
      },
      {
        id: "asset-gradients",
        kind: "image",
        src: "/gradients-preview.png",
        alt: "6529 Gradients collection preview",
        title: "6529 Gradients",
        width: 1200,
        height: 630,
      },
      {
        id: "asset-nextgen",
        kind: "image",
        src: "/nextgen.png",
        alt: "NextGen collection preview",
        title: "NextGen",
        width: 1200,
        height: 630,
      },
    ],
    blocks: [
      {
        id: "studio-intro",
        type: "heading",
        level: 2,
        eyebrow: "Generated gallery",
        text: `${styleLabel} profile package`,
      },
      {
        id: "studio-copy",
        type: "rich_text",
        paragraphs: [
          "This package is shaped for decentralized publishing: deterministic content, explicit storage receipts, social metadata, and wallet snapshots.",
        ],
      },
      {
        id: "wallet-gallery",
        type: "generated_wallet_gallery",
        title: "Wallet gallery snapshot",
        wallets,
        snapshot: {
          captured_at: FIXTURE_TIMESTAMP,
          block_number: 22500000,
        },
        stats: [
          { label: "Wallets", value: String(wallets.length) },
          { label: "Collections", value: "3" },
          { label: "Style", value: styleLabel },
        ],
        collections: [
          {
            title: "The Memes",
            count: 25,
            asset_id: "asset-memes",
            href: `/${displayHandle}/collections/the-memes/index.html`,
          },
          {
            title: "6529 Gradients",
            count: 12,
            asset_id: "asset-gradients",
            href: `/${displayHandle}/collections/6529-gradients/index.html`,
          },
          {
            title: "NextGen",
            count: 11,
            asset_id: "asset-nextgen",
            href: `/${displayHandle}/collections/nextgen/index.html`,
          },
        ],
      },
      {
        id: "publish-readiness",
        type: "callout",
        tone: "evidence",
        title: "Publish-ready shape",
        body: "The builder emits a package that can be stored on IPFS or Arweave and accelerated by 6529.io without making the hosted app the source of truth.",
      },
    ],
    provenance: {
      source: "wallet_gallery",
      builder_version: "profile-cms-studio-0.1.0",
      notes: [
        "Wallet gallery pages are snapshot based.",
        "3D rooms must carry a 2D fallback in the same package.",
      ],
    },
  };
}

export default function ProfileCmsStudio() {
  const { requestAuth, setToast } = useAuth();
  const [handle, setHandle] = useState("punk6529");
  const [title, setTitle] = useState("Collected Signals");
  const [description, setDescription] = useState(
    "A wallet-native gallery with collection pages, NFT pages, social cards, and decentralized package evidence."
  );
  const [walletText, setWalletText] = useState(DEFAULT_ADDRESS);
  const [galleryStyle, setGalleryStyle] = useState<GalleryStyle>("editorial");
  const [storageTarget, setStorageTarget] = useState<StorageTarget>("both");
  const [copied, setCopied] = useState(false);
  const [copiedEvidence, setCopiedEvidence] = useState<CopiedEvidence>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<PublishStatus | null>(
    null
  );
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const displayHandle = getProfileHandlePath(handle);
  const wallets = useMemo(() => parseWallets(walletText), [walletText]);
  const walletErrors = useMemo(() => getWalletErrors(wallets), [wallets]);
  const packageResult = useMemo(() => {
    if (walletErrors.length > 0) {
      return null;
    }
    return buildCmsPackage({
      payload: buildStudioPayload({
        handle,
        title,
        description,
        wallets,
        galleryStyle,
      }),
      signature: {
        signature_type: "fixture",
        signing_wallet: wallets[0] ?? DEFAULT_ADDRESS,
        signed_at: FIXTURE_TIMESTAMP,
        signature: "pending-wallet-signature",
      },
      storage: getStorage(storageTarget),
    });
  }, [
    description,
    galleryStyle,
    handle,
    storageTarget,
    title,
    walletErrors,
    wallets,
  ]);

  const routes = packageResult
    ? [
        packageResult.payload.page.static_export_path,
        `/${displayHandle}/collections/the-memes/index.html`,
        `/${displayHandle}/collections/6529-gradients/index.html`,
        `/${displayHandle}/nfts/ethereum/0x33fd426905f149f8376e227d0c9d3340aad17af1/1/index.html`,
      ]
    : [];

  const copyPackage = async () => {
    if (!packageResult) {
      return;
    }
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(packageResult, null, 2)
      );
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 1800);
    } catch {
      setPublishStatus({
        type: "error",
        message: "Clipboard access is blocked. Use Export instead.",
      });
    }
  };

  const copyEvidence = async (
    type: Exclude<CopiedEvidence, null>,
    value: string | undefined
  ) => {
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopiedEvidence(type);
      globalThis.setTimeout(() => setCopiedEvidence(null), 1800);
    } catch {
      setPublishStatus({
        type: "error",
        message: "Clipboard access is blocked. Use Export instead.",
      });
    }
  };

  const exportPackage = () => {
    if (!packageResult) {
      return;
    }
    const blob = new Blob([JSON.stringify(packageResult, null, 2)], {
      type: "application/json",
    });
    const url = globalThis.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${displayHandle}-cms-package.json`;
    anchor.click();
    anchor.remove();
    globalThis.URL.revokeObjectURL(url);
  };

  const requestPublishPackage = () => {
    if (!packageResult || isPublishing) {
      return;
    }
    setShowPublishConfirm(true);
  };

  const publishPackage = async () => {
    if (!packageResult || isPublishing) {
      return;
    }

    const auth = await requestAuth();
    if (!auth.success) {
      const message = "Connect and sign in to publish this CMS site.";
      setPublishStatus({ type: "error", message });
      setToast({ message, type: "error" });
      return;
    }

    setIsPublishing(true);
    setPublishStatus(null);
    try {
      const site = await getOrCreateCmsSite({ title, description });
      const published = await publishCmsPackage({
        siteId: site.id,
        cmsPackage: packageResult,
      });
      const publishedPath =
        published.site.primary_static_path ??
        packageResult.payload.page.static_export_path;
      const message = `Published ${publishedPath}`;
      setPublishStatus({ type: "success", message });
      setToast({ message: "CMS site published.", type: "success" });
    } catch (error) {
      const message = getCmsStudioErrorMessage(error);
      setPublishStatus({ type: "error", message });
      setToast({
        type: "error",
        title: "Couldn't publish CMS site.",
        description: message,
      });
    } finally {
      setIsPublishing(false);
      setShowPublishConfirm(false);
    }
  };

  return (
    <main className={css.shell}>
      <div className={css.header}>
        <div>
          <p className={css.eyebrow}>Profile CMS</p>
          <h1>Studio</h1>
        </div>
        <div className={css.headerMeta}>
          <span>/{displayHandle}/index.html</span>
          <span>{packageResult ? "package ready" : "needs wallet"}</span>
        </div>
      </div>

      <div className={css.workspace}>
        <section className={css.panel} aria-labelledby="site-settings">
          <h2 id="site-settings">Site</h2>
          <label>
            <span>Profile handle</span>
            <input
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              maxLength={32}
            />
          </label>
          <label>
            <span>Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={80}
            />
          </label>
          <label>
            <span>Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={240}
            />
          </label>
          <label>
            <span>Wallets</span>
            <textarea
              value={walletText}
              onChange={(event) => setWalletText(event.target.value)}
              rows={4}
              spellCheck={false}
            />
          </label>
          {walletErrors.length > 0 ? (
            <div className={css.errorList}>
              {walletErrors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}
        </section>

        <section className={css.panel} aria-labelledby="gallery-settings">
          <h2 id="gallery-settings">Gallery</h2>
          <div
            aria-label="Gallery style"
            className={css.segmented}
            role="radiogroup"
          >
            {styleOptions.map((option) => {
              const Icon = option.icon;
              const selected = galleryStyle === option.id;
              return (
                <button
                  aria-checked={selected}
                  className={selected ? css.selectedSegment : ""}
                  key={option.id}
                  onClick={() => setGalleryStyle(option.id)}
                  role="radio"
                  type="button"
                >
                  <Icon aria-hidden="true" />
                  <span>{option.label}</span>
                  <small>{option.description}</small>
                  {selected ? (
                    <span className={css.selectedBadge}>
                      <CheckCircleIcon aria-hidden="true" />
                      Selected
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className={css.storageRow}>
            <span>Storage</span>
            <div className={css.storageButtons}>
              {storageOptions.map((option) => (
                <button
                  className={
                    storageTarget === option.id ? css.selectedPill : ""
                  }
                  aria-pressed={storageTarget === option.id}
                  key={option.id}
                  onClick={() => setStorageTarget(option.id)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <p className={css.storageHint}>
            IPFS improves retrieval and mirroring. Arweave records permanence.
            6529.io can accelerate either path without being the source of
            truth.
          </p>

          <div className={css.previewFrame}>
            <div>
              <p className={css.eyebrow}>{displayHandle}</p>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
            <div className={css.previewGrid}>
              <Image
                src="/memes-preview.png"
                alt="The Memes preview"
                width={480}
                height={360}
              />
              <Image
                src="/gradients-preview.png"
                alt="6529 Gradients preview"
                width={480}
                height={360}
              />
              <Image
                src="/nextgen.png"
                alt="NextGen preview"
                width={480}
                height={360}
              />
            </div>
          </div>
        </section>

        <aside className={css.panel} aria-labelledby="package-evidence">
          <h2 id="package-evidence">Package</h2>
          <div className={css.evidence}>
            <div className={css.evidenceHeader}>
              <p>Hash</p>
              <button
                disabled={!packageResult}
                onClick={() =>
                  copyEvidence("package", packageResult?.package_hash)
                }
                type="button"
              >
                {copiedEvidence === "package" ? "Copied" : "Copy"}
              </button>
            </div>
            <code>{packageResult?.package_hash ?? "not generated"}</code>
          </div>
          <div className={css.evidence}>
            <div className={css.evidenceHeader}>
              <p>Payload</p>
              <button
                disabled={!packageResult}
                onClick={() =>
                  copyEvidence("payload", packageResult?.payload_hash)
                }
                type="button"
              >
                {copiedEvidence === "payload" ? "Copied" : "Copy"}
              </button>
            </div>
            <code>{packageResult?.payload_hash ?? "not generated"}</code>
          </div>
          <div className={css.routeList}>
            {routes.map((route) => (
              <div key={route}>
                <CheckCircleIcon aria-hidden="true" />
                <span>{route}</span>
              </div>
            ))}
          </div>
          <div className={css.actionRow}>
            <button
              disabled={!packageResult}
              onClick={copyPackage}
              type="button"
            >
              <DocumentDuplicateIcon aria-hidden="true" />
              <span>{copied ? "Copied" : "Copy JSON"}</span>
            </button>
            <button
              disabled={!packageResult}
              onClick={exportPackage}
              type="button"
            >
              <ArrowDownTrayIcon aria-hidden="true" />
              <span>Export</span>
            </button>
            <button
              disabled={!packageResult || isPublishing}
              onClick={requestPublishPackage}
              className={css.publishButton}
              type="button"
            >
              <CloudArrowUpIcon aria-hidden="true" />
              <span>{isPublishing ? "Publishing" : "Publish"}</span>
            </button>
          </div>
          {publishStatus ? (
            <p
              className={`${css.publishStatus} ${
                publishStatus.type === "success"
                  ? css.publishStatusSuccess
                  : css.publishStatusError
              }`}
            >
              {publishStatus.message}
            </p>
          ) : null}
        </aside>
      </div>
      {showPublishConfirm && packageResult ? (
        <div className={css.dialogLayer}>
          <button
            aria-label="Close publish confirmation"
            className={css.dialogBackdrop}
            onClick={() => setShowPublishConfirm(false)}
            type="button"
          />
          <dialog
            aria-labelledby="profile-cms-publish-title"
            className={css.confirmDialog}
            open
          >
            <p className={css.eyebrow}>Publish</p>
            <h2 id="profile-cms-publish-title">Set primary CMS site</h2>
            <p>
              This will set {packageResult.payload.page.static_export_path} as{" "}
              the profile&apos;s primary CMS website through the 6529 API
              pointer. The package remains exportable and content-addressed.
            </p>
            <div className={css.confirmGrid}>
              <div>
                <span>Storage intent</span>
                <strong>
                  {
                    storageOptions.find((option) => option.id === storageTarget)
                      ?.label
                  }
                </strong>
              </div>
              <div>
                <span>Package</span>
                <strong>{packageResult.package_hash}</strong>
              </div>
            </div>
            <p className={css.storageHint}>
              Current MVP packages carry pending storage receipts and a draft
              signature envelope. Final decentralized publish still needs the
              wallet package-signature and real IPFS/Arweave receipt adapter.
            </p>
            <div className={css.confirmActions}>
              <button
                className={css.secondaryAction}
                disabled={isPublishing}
                onClick={() => setShowPublishConfirm(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className={css.publishButton}
                disabled={isPublishing}
                onClick={publishPackage}
                type="button"
              >
                <CloudArrowUpIcon aria-hidden="true" />
                <span>{isPublishing ? "Publishing" : "Confirm publish"}</span>
              </button>
            </div>
          </dialog>
        </div>
      ) : null}
    </main>
  );
}
