"use client";

import {
  createContext,
  memo,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react";
import type { Components } from "react-markdown";
import { useQueryClient } from "@tanstack/react-query";
import { MessageMarkdown } from "@/components/markdown/MessageMarkdown";

import { useEmoji } from "@/contexts/EmojiContext";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropNftLink } from "@/generated/models/ApiDropNftLink";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import type { ApiDropReferencedNFT } from "@/generated/models/ApiDropReferencedNFT";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import {
  LinkPreviewProvider,
  useLinkPreviewContext,
  type LinkPreviewToggleControl,
} from "@/components/waves/LinkPreviewContext";
import { primeMarketplacePreviewCacheFromNftLinks } from "@/components/waves/marketplace/common";

import { createMarkdownContentRenderers } from "./dropPartMarkdown/content";
import {
  createLinkRenderer,
  DEFAULT_MAX_EMBED_DEPTH,
} from "./dropPartMarkdown/linkHandlers";

const EMPTY_MENTIONED_GROUPS: ApiDropGroupMention[] = [];
const EMOJI_SHORTCODE_REGEX = /:\w+:/;

const normalizeStringArray = (values?: readonly string[]): string[] =>
  values?.filter((value) => typeof value === "string" && value.length > 0) ??
  [];

type MarkdownComponentsOptions = Pick<
  ReturnType<typeof createMarkdownContentRenderers>,
  "renderParagraph"
> &
  Pick<ReturnType<typeof createLinkRenderer>, "renderAnchor" | "renderImage">;

const MarkdownRenderersContext =
  createContext<MarkdownComponentsOptions | null>(null);
function useMarkdownRenderers() {
  const renderers = useContext(MarkdownRenderersContext);
  if (!renderers) throw new Error("Markdown renderers are unavailable");
  return renderers;
}
const ParagraphRenderer = (
  props: Parameters<MarkdownComponentsOptions["renderParagraph"]>[0]
) => useMarkdownRenderers().renderParagraph(props);
const AnchorRenderer = (
  props: Parameters<MarkdownComponentsOptions["renderAnchor"]>[0]
) => useMarkdownRenderers().renderAnchor(props);
const ImageRenderer = (
  props: Parameters<MarkdownComponentsOptions["renderImage"]>[0]
) => useMarkdownRenderers().renderImage(props);
const PUBLIC_COMPONENTS: Components = {
  p: ParagraphRenderer,
  a: AnchorRenderer,
  img: ImageRenderer,
};

export interface DropPartMarkdownProps {
  readonly mentionedUsers: Array<ApiDropMentionedUser>;
  readonly mentionedGroups?: Array<ApiDropGroupMention> | undefined;
  readonly mentionedWaves: Array<ApiMentionedWave>;
  readonly referencedNfts: Array<ApiDropReferencedNFT>;
  readonly nftLinks?: readonly ApiDropNftLink[] | undefined;
  readonly partContent: string | null;
  readonly collapsedPreview?: boolean | undefined;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly textSize?: "sm" | "md" | undefined;
  readonly currentDropId?: string | undefined;
  readonly hideLinkPreviews?: boolean | undefined;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
  readonly fullWidthLinkPreviews?: boolean | undefined;
  readonly bodyGalleryKeyPrefix?: string | undefined;
  readonly linkPreviewToggleControl?: LinkPreviewToggleControl | undefined;
  readonly onLinkCardActionsActiveChange?:
    | ((href: string, active: boolean) => void)
    | undefined;
}

function DropPartMarkdown({
  mentionedUsers,
  mentionedGroups = EMPTY_MENTIONED_GROUPS,
  mentionedWaves,
  referencedNfts,
  nftLinks,
  partContent,
  collapsedPreview = false,
  onQuoteClick,
  textSize,
  currentDropId,
  hideLinkPreviews = false,
  embedPath,
  quotePath,
  embedDepth = 0,
  maxEmbedDepth = DEFAULT_MAX_EMBED_DEPTH,
  fullWidthLinkPreviews = false,
  bodyGalleryKeyPrefix,
  linkPreviewToggleControl,
  onLinkCardActionsActiveChange,
}: DropPartMarkdownProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobileScreen();
  const { emojiMap, findNativeEmoji, loadEmojiData } = useEmoji();
  const seizeSettings = useSeizeSettingsOptional();
  const { variant: linkPreviewVariant } = useLinkPreviewContext();

  useEffect(() => {
    if (!partContent || !EMOJI_SHORTCODE_REGEX.test(partContent)) {
      return;
    }

    void loadEmojiData();
  }, [loadEmojiData, partContent]);

  useLayoutEffect(() => {
    primeMarketplacePreviewCacheFromNftLinks({
      queryClient,
      nftLinks,
    });
  }, [queryClient, nftLinks]);

  const textSizeClass = useMemo(() => {
    switch (textSize) {
      case "sm":
        return isMobile ? "tw-text-xs" : "tw-text-sm";
      case "md":
      case undefined:
      default:
        return "tw-text-md";
    }
  }, [isMobile, textSize]);

  const normalizedEmbedPath = useMemo(() => {
    const path = normalizeStringArray(embedPath);
    if (!currentDropId || path.includes(currentDropId)) {
      return path;
    }

    return [...path, currentDropId];
  }, [currentDropId, embedPath]);

  const normalizedQuotePath = useMemo(
    () => normalizeStringArray(quotePath),
    [quotePath]
  );

  const { renderAnchor, isSmartLink, renderImage } = useMemo(
    () =>
      createLinkRenderer({
        onQuoteClick,
        currentDropId,
        hideLinkPreviews,
        isMemesWaveById: seizeSettings?.isMemesWave,
        isQuorumWaveById: seizeSettings?.isQuorumWave,
        embedPath: normalizedEmbedPath,
        quotePath: normalizedQuotePath,
        embedDepth,
        maxEmbedDepth,
        fullWidthLinkPreviews,
        bodyGalleryKeyPrefix,
      }),
    [
      onQuoteClick,
      currentDropId,
      hideLinkPreviews,
      seizeSettings?.isMemesWave,
      seizeSettings?.isQuorumWave,
      normalizedEmbedPath,
      normalizedQuotePath,
      embedDepth,
      maxEmbedDepth,
      fullWidthLinkPreviews,
      bodyGalleryKeyPrefix,
    ]
  );

  const { customRenderer, renderParagraph } = useMemo(
    () =>
      createMarkdownContentRenderers({
        textSizeClass,
        mentionedUsers,
        mentionedGroups,
        mentionedWaves,
        referencedNfts,
        emojiMap,
        findNativeEmoji,
        isSmartLink,
      }),
    [
      textSizeClass,
      mentionedUsers,
      mentionedGroups,
      mentionedWaves,
      referencedNfts,
      emojiMap,
      findNativeEmoji,
      isSmartLink,
    ]
  );

  const markdownRenderers = useMemo<MarkdownComponentsOptions>(
    () => ({
      renderParagraph,
      renderAnchor,
      renderImage,
    }),
    [renderAnchor, renderImage, renderParagraph]
  );

  return (
    <LinkPreviewProvider
      variant={linkPreviewVariant}
      previewToggle={linkPreviewToggleControl}
      onCardActionsActiveChange={onLinkCardActionsActiveChange}
    >
      <MarkdownRenderersContext.Provider value={markdownRenderers}>
        <MessageMarkdown
          text={partContent}
          privacy="public"
          collapsedPreview={collapsedPreview}
          messageId={currentDropId}
          className="tw-w-full"
          components={PUBLIC_COMPONENTS}
          renderText={customRenderer}
        />
      </MarkdownRenderersContext.Provider>
    </LinkPreviewProvider>
  );
}

export default memo(DropPartMarkdown);
