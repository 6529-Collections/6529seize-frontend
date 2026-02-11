import type { ReactElement } from "react";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import {
  getSeizeBaseOrigin,
  parseSeizeQueryLink,
  parseSeizeWaveLink,
  parseSeizeQuoteLink,
  type SeizeQuoteLinkInfo,
} from "@/helpers/SeizeLinkParser";

import GroupCardChat from "@/components/groups/page/list/card/GroupCardChat";
import DropItemChat from "@/components/waves/drops/DropItemChat";
import WaveItemChat from "@/components/waves/list/WaveItemChat";
import type { LinkHandler } from "../linkTypes";
import { renderSeizeQuote } from "../renderers";

interface CreateSeizeHandlersConfig {
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly currentDropId?: string | undefined;
  readonly embedPath: readonly string[];
  readonly quotePath: readonly string[];
  readonly embedDepth: number;
  readonly maxEmbedDepth: number;
}

type SeizeGuardConfig = Omit<CreateSeizeHandlersConfig, "onQuoteClick">;

const ensureSeizeQuote = (href: string): SeizeQuoteLinkInfo => {
  const info = parseSeizeQuoteLink(href);
  if (!info) {
    throw new Error("Invalid seize quote link");
  }

  return info;
};

const getQuoteCycleKey = (info: SeizeQuoteLinkInfo): string | null => {
  if (!info.serialNo) {
    return null;
  }

  return `${info.waveId}:${info.serialNo}`;
};

const createSeizeQuoteHandler = (
  onQuoteClick: (drop: ApiDrop) => void,
  config: SeizeGuardConfig
): LinkHandler => ({
  match: (href) => Boolean(parseSeizeQuoteLink(href)),
  render: (href) => {
    if (config.embedDepth >= config.maxEmbedDepth) {
      throw new Error("Seize quote link exceeded max embed depth");
    }

    const quoteInfo = ensureSeizeQuote(href);
    const quoteCycleKey = getQuoteCycleKey(quoteInfo);
    if (quoteCycleKey && config.quotePath.includes(quoteCycleKey)) {
      throw new Error("Seize quote link creates a cycle");
    }

    if (
      quoteInfo.dropId &&
      (quoteInfo.dropId === config.currentDropId ||
        config.embedPath.includes(quoteInfo.dropId))
    ) {
      throw new Error("Seize quote link matches current embed path");
    }

    const nextQuotePath = quoteCycleKey
      ? [...config.quotePath, quoteCycleKey]
      : config.quotePath;

    const content = renderSeizeQuote(quoteInfo, onQuoteClick, href, {
      embedPath: config.embedPath,
      quotePath: nextQuotePath,
      embedDepth: config.embedDepth + 1,
      maxEmbedDepth: config.maxEmbedDepth,
    });
    if (!content) {
      throw new Error("Unable to render seize quote link");
    }

    return content;
  },
  display: "block",
});

const createSeizeQueryHandler = <T,>(
  extract: (href: string) => T | null,
  onMissing: string,
  render: (value: T, href: string) => ReactElement
): LinkHandler => ({
  match: (href) => Boolean(extract(href)),
  render: (href) => {
    const value = extract(href);
    if (!value) {
      throw new Error(onMissing);
    }

    return render(value, href);
  },
  display: "block",
});

const getGroupId = (href: string): string | null => {
  const result = parseSeizeQueryLink(href, "/network", ["group"]);
  if (!result || typeof result["group"] !== "string") {
    return null;
  }

  return result["group"];
};

const createSeizeGroupHandler = (): LinkHandler =>
  createSeizeQueryHandler(
    getGroupId,
    "Invalid seize group link",
    (groupId, href) => <GroupCardChat href={href} groupId={groupId} />
  );

const getWaveId = (href: string): string | null => parseSeizeWaveLink(href);

const createSeizeWaveHandler = (): LinkHandler =>
  createSeizeQueryHandler(
    getWaveId,
    "Invalid seize wave link",
    (waveId, href) => <WaveItemChat href={href} waveId={waveId} />
  );

const getDropId = (href: string): string | null => {
  const baseOrigin = getSeizeBaseOrigin();
  if (!baseOrigin) {
    return null;
  }

  try {
    const url = new URL(href, baseOrigin);
    if (url.origin !== baseOrigin) {
      return null;
    }
    const dropId = url.searchParams.get("drop");
    return dropId ?? null;
  } catch {
    return null;
  }
};

const createSeizeDropHandler = (config: SeizeGuardConfig): LinkHandler =>
  createSeizeQueryHandler(
    getDropId,
    "Invalid seize drop link",
    (dropId, href) => {
      if (config.embedDepth >= config.maxEmbedDepth) {
        throw new Error("Seize drop link exceeded max embed depth");
      }

      if (
        dropId === config.currentDropId ||
        config.embedPath.includes(dropId)
      ) {
        throw new Error("Seize drop link matches current drop");
      }

      return <DropItemChat href={href} dropId={dropId} />;
    }
  );

export const createSeizeHandlers = ({
  onQuoteClick,
  ...config
}: CreateSeizeHandlersConfig): LinkHandler[] => [
  createSeizeQuoteHandler(onQuoteClick, config),
  createSeizeGroupHandler(),
  createSeizeWaveHandler(),
  createSeizeDropHandler(config),
];
