import { AnchorHTMLAttributes, ClassAttributes, memo, ReactNode } from "react";
import Markdown, { ExtraProps } from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";
import DropListItemContentPart, {
  DropListItemContentPartProps,
} from "../item/content/DropListItemContentPart";
import { ApiDropMentionedUser } from "../../../../generated/models/ApiDropMentionedUser";
import { ApiDropReferencedNFT } from "../../../../generated/models/ApiDropReferencedNFT";
import { Tweet } from "react-tweet";
import Link from "next/link";

import DropPartMarkdownImage from "./DropPartMarkdownImage";
import WaveDropQuoteWithDropId from "../../../waves/drops/WaveDropQuoteWithDropId";
import WaveDropQuoteWithSerialNo from "../../../waves/drops/WaveDropQuoteWithSerialNo";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import {
  parseSeizeQueryLink,
  parseSeizeQuoteLink,
  SeizeQuoteLinkInfo,
} from "../../../../helpers/SeizeLinkParser";
import useIsMobileScreen from "../../../../hooks/isMobileScreen";
import { useEmoji } from "../../../../contexts/EmojiContext";
import GroupCardChat from "../../../groups/page/list/card/GroupCardChat";
import WaveItemChat from "../../../waves/list/WaveItemChat";
import DropItemChat from "../../../waves/drops/DropItemChat";

export interface DropPartMarkdownProps {
  readonly mentionedUsers: Array<ApiDropMentionedUser>;
  readonly referencedNfts: Array<ApiDropReferencedNFT>;
  readonly partContent: string | null;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly textSize?: "sm" | "md";
}

export enum DropContentPartType {
  MENTION = "MENTION",
  HASHTAG = "HASHTAG",
}

function DropPartMarkdown({
  mentionedUsers,
  referencedNfts,
  partContent,
  onQuoteClick,
  textSize,
}: DropPartMarkdownProps) {
  const isMobile = useIsMobileScreen();
  const { emojiMap } = useEmoji();
  const textSizeClass = (() => {
    switch (textSize) {
      case "sm":
        return isMobile ? "tw-text-xs" : "tw-text-sm";
      default:
        return "tw-text-md"; // Always use medium text for both mobile and desktop
    }
  })();

  const customPartRenderer = ({
    content,
    mentionedUsers,
    referencedNfts,
  }: {
    readonly content: ReactNode | undefined;
    readonly mentionedUsers: Array<ApiDropMentionedUser>;
    readonly referencedNfts: Array<ApiDropReferencedNFT>;
  }) => {
    if (typeof content !== "string") {
      return content;
    }

    const splitter = getRandomObjectId();

    const values: Record<string, DropListItemContentPartProps> = {
      ...mentionedUsers.reduce(
        (acc, user) => ({
          ...acc,
          [`@[${user.handle_in_content}]`]: {
            type: DropContentPartType.MENTION,
            value: user,
            match: `@[${user.handle_in_content}]`,
          },
        }),
        {}
      ),
      ...referencedNfts.reduce(
        (acc, nft) => ({
          ...acc,
          [`#[${nft.name}]`]: {
            type: DropContentPartType.HASHTAG,
            value: nft,
            match: `#[${nft.name}]`,
          },
        }),
        {}
      ),
    };

    let currentContent = content;

    for (const token of Object.values(values)) {
      currentContent = currentContent.replaceAll(
        token.match,
        `${splitter}${token.match}${splitter}`
      );
    }
    const parts = currentContent
      .split(splitter)
      .filter((part) => part !== "")
      .map((part) => {
        const partProps = values[part];
        if (partProps) {
          const randomId = getRandomObjectId();
          return <DropListItemContentPart key={randomId} part={partProps} />;
        } else {
          const emojiRegex = /(:\w+:)/g;
          const parts = part.split(emojiRegex);

          const isEmoji = (str: string): boolean => {
            const emojiTextRegex =
              /^(?:\ud83c[\udffb-\udfff]|\ud83d[\udc00-\ude4f\ude80-\udfff]|\ud83e[\udd00-\uddff]|\u00a9|\u00ae|\u200d|\u203c|\u2049|\u2122|\u2139|\u2194-\u21aa|\u231a-\u23fa|\u24c2|\u25aa-\u25fe|\u2600-\u27bf|\u2934-\u2b55|\u3030|\u303d|\u3297|\u3299|\ufe0f)$/;
            return emojiTextRegex.test(str.trim());
          };

          const areAllPartsEmojis = parts
            .filter((p) => !!p)
            .every((part) => part.match(emojiRegex) || isEmoji(part));

          return parts.map((part) =>
            part.match(emojiRegex) ? (
              <span key={getRandomObjectId()}>
                {renderEmoji(part, areAllPartsEmojis)}
              </span>
            ) : (
              <span
                key={getRandomObjectId()}
                className={`${
                  areAllPartsEmojis ? "emoji-text-node" : "tw-align-middle"
                }`}>
                {part}
              </span>
            )
          );
        }
      });

    return parts;
  };

  const customRenderer = ({
    content,
    mentionedUsers,
    referencedNfts,
  }: {
    readonly content: ReactNode | undefined;
    readonly mentionedUsers: Array<ApiDropMentionedUser>;
    readonly referencedNfts: Array<ApiDropReferencedNFT>;
  }) => {
    if (typeof content === "string") {
      return customPartRenderer({
        content,
        mentionedUsers,
        referencedNfts,
      });
    }

    if (Array.isArray(content)) {
      return content.map((child) => {
        if (typeof child === "string") {
          return customPartRenderer({
            content: child,
            mentionedUsers,
            referencedNfts,
          });
        }

        return child;
      });
    }

    return content;
  };

  const renderEmoji = (emojiProps: string, bigEmoji: boolean) => {
    const emojiId = emojiProps.replaceAll(":", "");
    const emoji = emojiMap
      .flatMap((cat) => cat.emojis)
      .find((e) => e.id === emojiId);

    if (!emoji) {
      return <span>{`:${emojiId}:`}</span>;
    }

    return (
      <img
        src={emoji.skins[0].src}
        alt={emojiId}
        className={`${bigEmoji ? "emoji-node-big" : "emoji-node"}`}
      />
    );
  };

  const aHrefRenderer = ({
    node,
    ...props
  }: ClassAttributes<HTMLAnchorElement> &
    AnchorHTMLAttributes<HTMLAnchorElement> &
    ExtraProps) => {
    const { href } = props;

    if (!href || !isValidLink(href)) {
      return null;
    }

    const quoteInfo = parseSeizeQuoteLink(href);
    if (quoteInfo) {
      return renderSeizeQuote(quoteInfo, onQuoteClick);
    }

    const groupResult = parseSeizeQueryLink(href, "/network", ["group"]);
    if (groupResult) {
      return <GroupCardChat href={href} groupId={groupResult.group} />;
    }

    const waveResult = parseSeizeQueryLink(href, "/my-stream", ["wave"], true);
    if (waveResult) {
      return <WaveItemChat href={href} waveId={waveResult.wave} />;
    }

    const dropResult = parseSeizeQueryLink(
      href,
      "/my-stream",
      ["wave", "drop"],
      true
    );
    if (dropResult) {
      return <DropItemChat href={href} dropId={dropResult.drop} />;
    }

    const twitterMatch = parseTwitterLink(href);
    if (twitterMatch) {
      return renderTweetEmbed(twitterMatch, href);
    }

    return renderExternalOrInternalLink(href, props);
  };

  const parseTwitterLink = (href: string): string | null => {
    const twitterRegex =
      /https:\/\/(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)/;
    const match = href.match(twitterRegex);
    return match ? match[3] : null;
  };

  const renderTweetEmbed = (tweetId: string, href: string) => (
    <div className="tweet-card">
      <Link
        className="tw-no-underline"
        target="_blank"
        href={href}
        data-theme="dark">
        <Tweet id={tweetId} />
      </Link>
    </div>
  );

  const isValidLink = (href: string): boolean => {
    try {
      new URL(href);
      return true;
    } catch {
      return false;
    }
  };

  const renderExternalOrInternalLink = (
    href: string,
    props: AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps
  ) => {
    const baseEndpoint = process.env.BASE_ENDPOINT || "";
    const isExternalLink = baseEndpoint && !href.startsWith(baseEndpoint);

    if (isExternalLink) {
      props.rel = "noopener noreferrer nofollow";
      props.target = "_blank";
    } else {
      props.href = href.replace(baseEndpoint, "");
    }

    return (
      <a
        onClick={(e) => {
          e.stopPropagation();
          if (props.onClick) {
            props.onClick(e);
          }
        }}
        {...props}
      />
    );
  };

  const renderSeizeQuote = (
    quoteLinkInfo: SeizeQuoteLinkInfo,
    onQuoteClick: (drop: ApiDrop) => void
  ) => {
    const { waveId, serialNo, dropId } = quoteLinkInfo;

    if (serialNo) {
      return (
        <WaveDropQuoteWithSerialNo
          serialNo={parseInt(serialNo)}
          waveId={waveId}
          onQuoteClick={onQuoteClick}
        />
      );
    } else if (dropId) {
      return (
        <WaveDropQuoteWithDropId
          dropId={dropId}
          partId={1}
          maybeDrop={null}
          onQuoteClick={onQuoteClick}
        />
      );
    }

    return null;
  };

  return (
    <Markdown
      rehypePlugins={[
        [
          rehypeExternalLinks,
          {
            target: "_blank",
            rel: ["noopener", "noreferrer", "nofollow'"],
            protocols: ["http", "https"],
          },
        ],
        [rehypeSanitize],
      ]}
      remarkPlugins={[remarkGfm]}
      className="tw-w-full tw-space-y-1"
      components={{
        h5: (params) => (
          <h5 className="tw-text-iron-200 tw-break-words word-break">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </h5>
        ),
        h4: (params) => (
          <h4 className="tw-text-iron-200 tw-break-words word-break">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </h4>
        ),
        h3: (params) => (
          <h3 className="tw-text-iron-200 tw-break-words word-break">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </h3>
        ),
        h2: (params) => (
          <h2 className="tw-text-iron-200 tw-break-words word-break">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </h2>
        ),
        h1: (params) => (
          <h1 className="tw-text-iron-200 tw-break-words word-break">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </h1>
        ),
        p: (params) => (
          <p
            className={`tw-mb-0 tw-leading-6 tw-text-iron-200 tw-font-normal tw-whitespace-pre-wrap tw-break-words word-break tw-transition tw-duration-300 tw-ease-out ${textSizeClass}`}>
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </p>
        ),
        li: (params) => (
          <li className="tw-text-md tw-text-iron-200 tw-break-words word-break">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </li>
        ),
        code: (params) => (
          <code
            style={{ textOverflow: "unset" }}
            className="tw-text-iron-200 tw-whitespace-pre-wrap tw-break-words">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </code>
        ),
        a: (params) => aHrefRenderer(params),
        img: (params) => <DropPartMarkdownImage src={params.src ?? ""} />,
        blockquote: (params) => (
          <blockquote className="tw-text-iron-200 tw-break-words word-break tw-pl-4 tw-border-l-4 tw-border-l-iron-500 tw-border-solid tw-border-t-0 tw-border-r-0 tw-border-b-0">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </blockquote>
        ),
      }}>
      {partContent}
    </Markdown>
  );
}

export default memo(DropPartMarkdown);
