import type { CSSProperties, ReactNode } from "react";

import {
  findCmsAsset,
  getSafeCmsMediaUrl,
  resolveCmsLinkUrl,
} from "@/lib/cms/media";
import type {
  CmsAsset,
  CmsBlock,
  CmsCalloutBlock,
  CmsCollectionReferenceBlock,
  CmsGalleryBlock,
  CmsHeadingBlock,
  CmsImageBlock,
  CmsNftReferenceBlock,
  CmsPublishedPackage,
  CmsQuoteBlock,
  CmsRichTextBlock,
  CmsTransactionReferenceBlock,
  CmsWalletGalleryBlock,
} from "@/lib/cms/types";

import styles from "./CmsPageRenderer.module.scss";

type CmsRendererClassName =
  | "actionList"
  | "buttonLink"
  | "callout"
  | "caption"
  | "content"
  | "description"
  | "eyebrow"
  | "facts"
  | "fallback"
  | "galleryGrid"
  | "hashLabel"
  | "hashValue"
  | "hero"
  | "heroGrid"
  | "heroMeta"
  | "heroPanel"
  | "itemBody"
  | "itemCaption"
  | "itemCard"
  | "itemTitle"
  | "mediaFigure"
  | "mediaImage"
  | "packet"
  | "provenance"
  | "provenanceGrid"
  | "provenanceTitle"
  | "quote"
  | "referenceBody"
  | "referenceCard"
  | "referenceText"
  | "referenceTitle"
  | "richText"
  | "section"
  | "shell"
  | "stat"
  | "statLabel"
  | "stats"
  | "statValue"
  | "statusBanner"
  | "statusBannerTitle"
  | "title"
  | "titleLong"
  | "transactionCard"
  | "transactionSummary";

const css = styles as Readonly<Record<CmsRendererClassName, string>>;

type Props = {
  readonly cmsPackage: CmsPublishedPackage;
};

function getAsset(assets: readonly CmsAsset[], assetId: string): CmsAsset {
  const asset = findCmsAsset(assets, assetId);
  if (!asset) {
    return {
      id: assetId,
      kind: "image",
      src: "/6529io.png",
      alt: "Missing CMS asset",
      title: "Missing asset",
    };
  }
  return asset;
}

function MediaImage({
  asset,
  className,
}: {
  readonly asset: CmsAsset;
  readonly className?: string;
}) {
  return (
    // Published CMS packages can point at IPFS/Arweave/S3 mirrors, so use a
    // normal image element instead of coupling to Next image host allowlists.
    <img
      className={className ?? css.mediaImage}
      src={getSafeCmsMediaUrl(asset.src)}
      alt={asset.alt}
      width={asset.width}
      height={asset.height}
      loading="lazy"
    />
  );
}

function HeadingBlock({ block }: { readonly block: CmsHeadingBlock }) {
  const headingTags: Record<CmsHeadingBlock["level"], "h2" | "h3"> = {
    1: "h2",
    2: "h2",
    3: "h3",
  };
  const HeadingTag = headingTags[block.level];

  return (
    <section className={css.section}>
      {block.eyebrow ? <p className={css.eyebrow}>{block.eyebrow}</p> : null}
      <HeadingTag>{block.text}</HeadingTag>
    </section>
  );
}

function RichTextBlock({ block }: { readonly block: CmsRichTextBlock }) {
  return (
    <section className={css.richText}>
      {block.paragraphs.map((paragraph, index) => (
        <p key={`${block.id}-paragraph-${index}`}>{paragraph}</p>
      ))}
    </section>
  );
}

function ImageBlock({
  block,
  assets,
}: {
  readonly block: CmsImageBlock;
  readonly assets: readonly CmsAsset[];
}) {
  const asset = getAsset(assets, block.asset_id);
  return (
    <figure className={css.mediaFigure}>
      <MediaImage asset={asset} />
      <figcaption className={css.caption}>
        {block.caption ?? asset.caption ?? asset.title}
      </figcaption>
    </figure>
  );
}

function GalleryBlock({
  block,
  assets,
}: {
  readonly block: CmsGalleryBlock;
  readonly assets: readonly CmsAsset[];
}) {
  return (
    <section className={css.section}>
      {block.title ? <h2>{block.title}</h2> : null}
      <div className={css.galleryGrid}>
        {block.items.map((item) => {
          const asset = getAsset(assets, item.asset_id);
          const body = (
            <>
              <MediaImage asset={asset} />
              <div className={css.itemBody}>
                <p className={css.itemTitle}>{item.title ?? asset.title}</p>
                <p className={css.itemCaption}>
                  {item.caption ?? asset.caption}
                </p>
              </div>
            </>
          );
          const itemHref = item.href ? resolveCmsLinkUrl(item.href) : null;
          if (itemHref) {
            return (
              <a className={css.itemCard} href={itemHref} key={item.asset_id}>
                {body}
              </a>
            );
          }
          return (
            <div className={css.itemCard} key={item.asset_id}>
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function QuoteBlock({ block }: { readonly block: CmsQuoteBlock }) {
  return (
    <figure className={css.quote}>
      <blockquote>{block.quote}</blockquote>
      {block.attribution ? <figcaption>{block.attribution}</figcaption> : null}
    </figure>
  );
}

function CalloutBlock({ block }: { readonly block: CmsCalloutBlock }) {
  return (
    <aside className={css.callout}>
      <h2>{block.title}</h2>
      <p>{block.body}</p>
    </aside>
  );
}

function ButtonLinkBlock({
  href,
  children,
}: {
  readonly href: string | null;
  readonly children: ReactNode;
}) {
  if (!href) {
    return (
      <span aria-disabled="true" className={css.buttonLink}>
        {children}
      </span>
    );
  }

  return (
    <a className={css.buttonLink} href={href}>
      {children}
    </a>
  );
}

function Facts({ rows }: { readonly rows: readonly [string, string][] }) {
  return (
    <div className={css.facts}>
      {rows.map(([label, value], index) => (
        <div key={`${label}-${index}`}>
          {label}: {value}
        </div>
      ))}
    </div>
  );
}

function NftReferenceBlock({
  block,
  assets,
}: {
  readonly block: CmsNftReferenceBlock;
  readonly assets: readonly CmsAsset[];
}) {
  const asset = getAsset(assets, block.asset_id);
  return (
    <section className={css.referenceCard}>
      <MediaImage asset={asset} />
      <div className={css.referenceBody}>
        <p className={css.eyebrow}>NFT reference</p>
        <h2 className={css.referenceTitle}>{block.title}</h2>
        <p className={css.referenceText}>
          {block.collection}
          {block.creator ? ` by ${block.creator}` : ""}
        </p>
        <Facts
          rows={[
            ["Chain", String(block.chain_id)],
            ["Contract", block.contract],
            ["Token", block.token_id],
            ["Captured", block.snapshot.captured_at],
          ]}
        />
      </div>
    </section>
  );
}

function CollectionReferenceBlock({
  block,
  assets,
}: {
  readonly block: CmsCollectionReferenceBlock;
  readonly assets: readonly CmsAsset[];
}) {
  const asset = getAsset(assets, block.asset_id);
  return (
    <section className={css.referenceCard}>
      <MediaImage asset={asset} />
      <div className={css.referenceBody}>
        <p className={css.eyebrow}>Collection reference</p>
        <h2 className={css.referenceTitle}>{block.title}</h2>
        <p className={css.referenceText}>{block.summary}</p>
        {block.knowledge_packet ? (
          <p className={css.packet}>
            Packet {block.knowledge_packet.id} v{block.knowledge_packet.version}
          </p>
        ) : null}
        <Facts
          rows={[
            ["Chain", String(block.chain_id)],
            ["Contract", block.contract],
          ]}
        />
      </div>
    </section>
  );
}

function TransactionReferenceBlock({
  block,
}: {
  readonly block: CmsTransactionReferenceBlock;
}) {
  return (
    <section className={css.transactionCard}>
      <p className={css.eyebrow}>Transaction reference</p>
      <p className={css.transactionSummary}>{block.summary}</p>
      <ol className={css.actionList}>
        {block.actions.map((action, index) => (
          <li key={`${block.id}-action-${index}`}>{action}</li>
        ))}
      </ol>
      <Facts
        rows={[
          ["Chain", String(block.chain_id)],
          ["Hash", block.hash],
          ["Block", String(block.block_number)],
          ["From", block.from],
          ["To", block.to],
          ["Value", `${block.value_eth} ETH`],
          ["Captured", block.timestamp],
        ]}
      />
    </section>
  );
}

function WalletGalleryBlock({
  block,
  assets,
}: {
  readonly block: CmsWalletGalleryBlock;
  readonly assets: readonly CmsAsset[];
}) {
  return (
    <section className={css.section}>
      <h2>{block.title}</h2>
      <div className={css.stats}>
        {block.stats.map((stat) => (
          <div className={css.stat} key={stat.label}>
            <div className={css.statValue}>{stat.value}</div>
            <div className={css.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>
      <div className={css.galleryGrid}>
        {block.collections.map((collection) => {
          const asset = getAsset(assets, collection.asset_id);
          const card = (
            <>
              <MediaImage asset={asset} />
              <div className={css.itemBody}>
                <p className={css.itemTitle}>{collection.title}</p>
                <p className={css.itemCaption}>
                  {collection.count} works in snapshot
                </p>
              </div>
            </>
          );
          const collectionHref = collection.href
            ? resolveCmsLinkUrl(collection.href)
            : null;
          if (collectionHref) {
            return (
              <a
                className={css.itemCard}
                href={collectionHref}
                key={collection.title}
              >
                {card}
              </a>
            );
          }
          return (
            <div className={css.itemCard} key={collection.title}>
              {card}
            </div>
          );
        })}
      </div>
      <Facts
        rows={[
          ["Wallets", block.wallets.join(", ")],
          ["Captured", block.snapshot.captured_at],
        ]}
      />
    </section>
  );
}

function UnknownBlock({ block }: { readonly block: CmsBlock }) {
  return (
    <div className={css.fallback}>
      Unknown CMS block: <strong>{block.type}</strong>
    </div>
  );
}

function RenderBlock({
  block,
  assets,
}: {
  readonly block: CmsBlock;
  readonly assets: readonly CmsAsset[];
}) {
  switch (block.type) {
    case "heading":
      return <HeadingBlock block={block} />;
    case "rich_text":
      return <RichTextBlock block={block} />;
    case "image":
      return <ImageBlock block={block} assets={assets} />;
    case "gallery":
      return <GalleryBlock block={block} assets={assets} />;
    case "quote":
      return <QuoteBlock block={block} />;
    case "callout":
      return <CalloutBlock block={block} />;
    case "button_link":
      return (
        <ButtonLinkBlock href={resolveCmsLinkUrl(block.href)}>
          {block.label}
        </ButtonLinkBlock>
      );
    case "nft_reference":
      return <NftReferenceBlock block={block} assets={assets} />;
    case "collection_reference":
      return <CollectionReferenceBlock block={block} assets={assets} />;
    case "transaction_reference":
      return <TransactionReferenceBlock block={block} />;
    case "generated_wallet_gallery":
      return <WalletGalleryBlock block={block} assets={assets} />;
    default:
      return <UnknownBlock block={block} />;
  }
}

function isDraftPackage(cmsPackage: CmsPublishedPackage): boolean {
  return (
    cmsPackage.signature.signature_type === "fixture" ||
    cmsPackage.storage.some(
      (item) =>
        item.uri.startsWith("fixture://") ||
        item.uri.includes("pending-profile-cms-package")
    )
  );
}

export default function CmsPageRenderer({ cmsPackage }: Readonly<Props>) {
  const { payload } = cmsPackage;
  const showDraftBanner = isDraftPackage(cmsPackage);
  const themeStyle = {
    "--cms-accent": payload.site.theme.accent_color,
  } as CSSProperties;
  const titleClassName =
    payload.page.title.length > 28
      ? `${css.title} ${css.titleLong}`
      : css.title;

  return (
    <article className={css.shell} style={themeStyle}>
      <header className={css.hero}>
        <div className={css.heroGrid}>
          <div>
            <p className={css.eyebrow}>{payload.site.title}</p>
            <h1 className={titleClassName}>{payload.page.title}</h1>
            <p className={css.description}>{payload.page.description}</p>
          </div>
          <aside className={css.heroPanel} aria-label="CMS package evidence">
            <div className={css.heroMeta}>
              <div>
                <p className={css.hashLabel}>Package hash</p>
                <div className={css.hashValue}>{cmsPackage.package_hash}</div>
              </div>
              <div>
                <p className={css.hashLabel}>Static path</p>
                <div className={css.hashValue}>
                  {payload.page.static_export_path}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </header>

      <div className={css.content}>
        {showDraftBanner ? (
          <aside className={css.statusBanner}>
            <p className={css.statusBannerTitle}>Draft package evidence</p>
            <p>
              This preview contains fixture or pending signature/storage
              receipts. Treat it as a package-rendering preview until a wallet
              package signature and real IPFS or Arweave receipt are present.
            </p>
          </aside>
        ) : null}

        {payload.blocks.map((block) => (
          <RenderBlock block={block} assets={payload.assets} key={block.id} />
        ))}

        <footer className={css.provenance}>
          <p className={css.provenanceTitle}>Package provenance</p>
          <div className={css.provenanceGrid}>
            <div>
              <p className={css.hashLabel}>Payload hash</p>
              <div className={css.hashValue}>{cmsPackage.payload_hash}</div>
            </div>
            <div>
              <p className={css.hashLabel}>Signature</p>
              <div className={css.hashValue}>
                {cmsPackage.signature.signature_type} -{" "}
                {cmsPackage.signature.signing_wallet}
              </div>
            </div>
            <div>
              <p className={css.hashLabel}>Storage</p>
              <div className={css.hashValue}>
                {cmsPackage.storage.map((item) => item.uri).join(", ")}
              </div>
            </div>
            <div>
              <p className={css.hashLabel}>Builder</p>
              <div className={css.hashValue}>
                {payload.provenance.builder_version}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </article>
  );
}
