import { ApiDrop } from "@/generated/models/ApiDrop";
import {
  parseSeizeQuoteLink,
  parseSeizeQueryLink,
  type SeizeQuoteLinkInfo,
} from "@/helpers/SeizeLinkParser";

import GroupCardChat from "@/components/groups/page/list/card/GroupCardChat";
import DropItemChat from "@/components/waves/drops/DropItemChat";
import WaveItemChat from "@/components/waves/list/WaveItemChat";
import type { LinkHandler } from "../linkTypes";
import { renderExternalOrInternalLink } from "../linkUtils";
import { renderSeizeQuote } from "../renderers";

interface CreateSeizeHandlersConfig {
  readonly onQuoteClick: (drop: ApiDrop) => void;
}

const createSeizeQuoteHandler = (
  onQuoteClick: (drop: ApiDrop) => void
): LinkHandler<SeizeQuoteLinkInfo> => ({
  match: parseSeizeQuoteLink,
  render: (payload, context, anchorProps) =>
    renderSeizeQuote(payload, onQuoteClick, context.href) ??
    renderExternalOrInternalLink(context.href, anchorProps),
  display: "block",
});

const createSeizeGroupHandler = (): LinkHandler<{ groupId: string }> => ({
  match: (href) => {
    const result = parseSeizeQueryLink(href, "/network", ["group"]);
    if (!result || typeof result.group !== "string") {
      return null;
    }

    return { groupId: result.group };
  },
  render: (payload, context) => (
    <GroupCardChat href={context.href} groupId={payload.groupId} />
  ),
  display: "block",
});

const createSeizeWaveHandler = (): LinkHandler<{ waveId: string }> => ({
  match: (href) => {
    const result = parseSeizeQueryLink(href, "/my-stream", ["wave"], true);
    if (!result || typeof result.wave !== "string") {
      return null;
    }

    return { waveId: result.wave };
  },
  render: (payload, context) => (
    <WaveItemChat href={context.href} waveId={payload.waveId} />
  ),
  display: "block",
});

const createSeizeDropHandler = (): LinkHandler<{ dropId: string }> => ({
  match: (href) => {
    const result = parseSeizeQueryLink(href, "/my-stream", ["wave", "drop"], true);
    if (!result || typeof result.drop !== "string") {
      return null;
    }

    return { dropId: result.drop };
  },
  render: (payload, context) => (
    <DropItemChat href={context.href} dropId={payload.dropId} />
  ),
  display: "block",
});

export const createSeizeHandlers = ({
  onQuoteClick,
}: CreateSeizeHandlersConfig): Array<LinkHandler<any>> => [
  createSeizeQuoteHandler(onQuoteClick),
  createSeizeGroupHandler(),
  createSeizeWaveHandler(),
  createSeizeDropHandler(),
];

export type SeizeHandlers = ReturnType<typeof createSeizeHandlers>;
