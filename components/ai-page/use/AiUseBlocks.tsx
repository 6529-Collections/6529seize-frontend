import type { ReactNode } from "react";

import type { AiUseBlock } from "@/lib/ai-page/content/use";
import AiCodeBlock from "../AiCodeBlock";
import { AI_BODY, AI_H3 } from "../AiPageFrame";
import InlineText from "../InlineText";
import AiUseFigure, { AiUsePhoneRow } from "./AiUseFigure";
import { AI_USE_IMAGES } from "@/lib/ai-page/content/useImages";

type ImageBlock = Extract<AiUseBlock, { kind: "image" }>;

function isPhone(block: AiUseBlock): block is ImageBlock {
  return block.kind === "image" && AI_USE_IMAGES[block.image].kind === "phone";
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

function Table({
  block,
}: {
  readonly block: Extract<AiUseBlock, { kind: "table" }>;
}) {
  return (
    <div className="tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08]">
      <table className="tw-w-full tw-border-collapse tw-text-left tw-text-sm tw-leading-6">
        <thead>
          <tr className="tw-bg-white/[0.03]">
            {block.head.map((cell) => (
              <th
                key={cell}
                scope="col"
                className="tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => (
            <tr
              key={row.join("|")}
              className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06]"
            >
              {row.map((cell, index) => (
                <td
                  key={cell}
                  className={`tw-px-4 tw-py-2.5 tw-align-top ${index === 0 ? "tw-font-medium tw-text-iron-100" : "tw-text-iron-300"}`}
                >
                  <InlineText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
    case "h3":
      return (
        <h3 id={block.id} className={`tw-mt-4 tw-scroll-mt-24 ${AI_H3}`}>
          {block.title}
        </h3>
      );
    case "steps":
      return <Steps items={block.items} />;
    case "code":
      return (
        <AiCodeBlock
          code={block.code}
          label={block.label}
          copy={!block.output}
        />
      );
    case "image":
      return <AiUseFigure image={block.image} alt={block.alt} />;
    case "table":
      return <Table block={block} />;
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
          />
        ) : (
          <Block key={blockKey(entry.block)} block={entry.block} />
        )
      )}
    </>
  );
}

function blockKey(block: AiUseBlock): string {
  switch (block.kind) {
    case "p":
      return `p:${block.text}`;
    case "h3":
      return `h3:${block.id}`;
    case "steps":
      return `steps:${block.items[0]?.text ?? ""}`;
    case "code":
      return `code:${block.label}:${block.code}`;
    case "image":
      return `image:${block.image}`;
    case "table":
      return `table:${block.head.join("|")}`;
    case "list":
      return `list:${block.items[0] ?? ""}`;
  }
}
