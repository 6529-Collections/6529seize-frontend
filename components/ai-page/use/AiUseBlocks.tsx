import { ClockIcon } from "@heroicons/react/20/solid";
import type { ReactNode } from "react";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import type { AiUseBlock } from "@/lib/ai-page/content/use";
import { AI_USE_IMAGES } from "@/lib/ai-page/content/useImages";
import AiCodeBlock from "../AiCodeBlock";
import { AI_BODY, AI_H3 } from "../AiPageFrame";
import type { AiZoomText } from "../AiZoomPicture";
import InlineText from "../InlineText";
import AiUseFigure, { AiUsePhoneRow } from "./AiUseFigure";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;
const ZOOM: AiZoomText = {
  open: t(LOCALE, "ai.use.zoom"),
  close: t(LOCALE, "ai.use.zoomClose"),
};
/** Output longer than this folds behind "Show output". */
const OUTPUT_LINES = 10;

type ImageBlock = Extract<AiUseBlock, { kind: "image" }>;

/** A whole phone-width screen, which sits in a row of them. */
function isPhone(block: AiUseBlock): block is ImageBlock {
  if (block.kind !== "image") {
    return false;
  }
  const picture = AI_USE_IMAGES[block.image];
  return picture.crop === null && picture.height > picture.width;
}

type Entry =
  | { readonly kind: "block"; readonly block: AiUseBlock }
  | { readonly kind: "phones"; readonly images: ImageBlock[] };

/** Consecutive phone screens become one row; every other block stays. */
function group(blocks: readonly AiUseBlock[]): Entry[] {
  const grouped: Entry[] = [];
  for (const block of blocks) {
    const last = grouped.at(-1);
    if (!isPhone(block)) {
      grouped.push({ kind: "block", block });
    } else if (last?.kind === "phones") {
      last.images.push(block);
    } else {
      grouped.push({ kind: "phones", images: [block] });
    }
  }
  return grouped;
}

function Steps({
  items,
}: {
  readonly items: Extract<AiUseBlock, { kind: "steps" }>["items"];
}) {
  return (
    <ol className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-7 tw-p-0">
      {items.map((item, index) => (
        <li key={item.text} className="tw-flex tw-flex-col tw-gap-4">
          <div className="tw-flex tw-gap-3 sm:tw-gap-4">
            <span
              aria-hidden="true"
              className="tw-flex tw-size-7 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500/15 tw-text-sm tw-font-semibold tw-tabular-nums tw-text-primary-300"
            >
              {index + 1}
            </span>
            <p className="tw-m-0 tw-pt-0.5 tw-text-[15px] tw-leading-6 tw-text-iron-100">
              <InlineText text={item.text} />
            </p>
          </div>
          {item.blocks && (
            <div className="tw-flex tw-flex-col tw-gap-4 sm:tw-pl-11">
              <AiUseBlocks blocks={item.blocks} />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

/**
 * What a command printed: quieter than a command, with no bar and no Copy
 * button, and folded behind "Show output" when it runs long.
 */
function Output({ code }: { readonly code: string }) {
  const lines = code.split("\n").length;
  const pre = (
    <pre className="tw-m-0 tw-overflow-x-auto tw-whitespace-pre tw-px-4 tw-py-3 tw-font-mono tw-text-[13px] tw-leading-6 tw-text-iron-400">
      <span className="tw-sr-only">{t(LOCALE, "ai.use.output")}: </span>
      {code}
    </pre>
  );
  const frame =
    "tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.04] tw-bg-white/[0.02]";
  if (lines <= OUTPUT_LINES) {
    return <div className={frame}>{pre}</div>;
  }
  return (
    <details className={`${frame} tw-group`}>
      <summary className="tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-gap-2 tw-px-4 tw-text-sm tw-text-iron-400 hover:tw-text-iron-100 sm:tw-min-h-10 [&::-webkit-details-marker]:tw-hidden">
        <span
          aria-hidden="true"
          className="tw-text-iron-600 tw-transition group-open:tw-rotate-90"
        >
          ›
        </span>
        <span className="group-open:tw-hidden">
          {t(LOCALE, "ai.use.showOutput", { lines: String(lines) })}
        </span>
        <span className="tw-hidden group-open:tw-inline">
          {t(LOCALE, "ai.use.hideOutput")}
        </span>
      </summary>
      {pre}
    </details>
  );
}

function Block({ block }: { readonly block: AiUseBlock }): ReactNode {
  switch (block.kind) {
    case "p":
      return (
        <p className={`tw-m-0 ${AI_BODY}`}>
          <InlineText text={block.text} />
        </p>
      );
    case "note":
      return (
        <p className="tw-m-0 tw-flex tw-gap-2.5 tw-rounded-lg tw-border-0 tw-border-l-2 tw-border-solid tw-border-primary-400/50 tw-bg-primary-500/[0.06] tw-py-2.5 tw-pl-3.5 tw-pr-4 tw-text-sm tw-leading-6 tw-text-iron-300">
          <ClockIcon
            aria-hidden="true"
            className="tw-mt-1 tw-size-4 tw-flex-none tw-text-primary-300"
          />
          <span>
            <span className="tw-font-semibold tw-text-iron-100">
              {t(LOCALE, "ai.use.expect")}:{" "}
            </span>
            <InlineText text={block.text} />
          </span>
        </p>
      );
    case "h3":
      return (
        <h3 id={block.id} className={`tw-mt-4 tw-scroll-mt-24 ${AI_H3}`}>
          {block.title}
        </h3>
      );
    case "steps":
      return <Steps items={block.items} />;
    case "code":
      return block.output ? (
        <Output code={block.code} />
      ) : (
        <AiCodeBlock code={block.code} label={block.label} />
      );
    case "image":
      return <AiUseFigure image={block.image} alt={block.alt} text={ZOOM} />;
    case "list":
      return (
        <ul className="tw-m-0 tw-flex tw-flex-col tw-gap-2 tw-pl-5">
          {block.items.map((item) => (
            <li key={item} className={`${AI_BODY} marker:tw-text-iron-600`}>
              <InlineText text={item} />
            </li>
          ))}
        </ul>
      );
  }
}

function blockKey(block: AiUseBlock): string {
  switch (block.kind) {
    case "p":
    case "note":
      return `${block.kind}:${block.text}`;
    case "h3":
      return `h3:${block.id}`;
    case "steps":
      return `steps:${block.items[0]?.text ?? ""}`;
    case "code":
      return `code:${block.label}:${block.code}`;
    case "image":
      return `image:${block.image}`;
    case "list":
      return `list:${block.items[0] ?? ""}`;
  }
}

/** The walk-through's blocks, in order. */
export default function AiUseBlocks({
  blocks,
}: {
  readonly blocks: readonly AiUseBlock[];
}) {
  return (
    <>
      {group(blocks).map((entry) =>
        entry.kind === "phones" ? (
          <AiUsePhoneRow
            key={entry.images.map((image) => image.image).join(",")}
            images={entry.images}
            text={ZOOM}
          />
        ) : (
          <Block key={blockKey(entry.block)} block={entry.block} />
        )
      )}
    </>
  );
}
