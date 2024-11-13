import { AnchorHTMLAttributes, ClassAttributes, memo, ReactNode } from "react";
import Markdown, { ExtraProps } from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";
import { DropContentPartType } from "../item/content/DropListItemContent";
import DropListItemContentPart, {
  DropListItemContentPartProps,
} from "../item/content/DropListItemContentPart";
import { ApiDropMentionedUser } from "../../../../generated/models/ApiDropMentionedUser";
import { ApiDropReferencedNFT } from "../../../../generated/models/ApiDropReferencedNFT";
import { Tweet } from "react-tweet";
import Link from "next/link";

import DropPartMarkdownImage from "./DropPartMarkdownImage";
import WaveDetailedDropQuoteWithDropId from "../../../waves/detailed/drops/WaveDetailedDropQuoteWithDropId";
import WaveDetailedDropQuoteWithSerialNo from "../../../waves/detailed/drops/WaveDetailedDropQuoteWithSerialNo";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import {
  parseSeizeLink,
  SeizeLinkInfo,
} from "../../../../helpers/SeizeLinkParser";

export interface DropPartMarkdownProps {
  readonly mentionedUsers: Array<ApiDropMentionedUser>;
  readonly referencedNfts: Array<ApiDropReferencedNFT>;
  readonly partContent: string | null;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly textSize?: "sm" | "md";
}

function DropPartMarkdown({
  mentionedUsers,
  referencedNfts,
  partContent,
  onQuoteClick,
  textSize = "md",
}: DropPartMarkdownProps) {
  const textSizeClass = (() => {
    switch (textSize) {
      case "sm":
        return "tw-text-sm";
      default:
        return "tw-text-md";
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
          return part;
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

  const aHrefRenderer = ({
    node,
    ...props
  }: ClassAttributes<HTMLAnchorElement> &
    AnchorHTMLAttributes<HTMLAnchorElement> &
    ExtraProps) => {
    const { href } = props;

    if (!href) {
      return null;
    }

    const seizeLinkInfo = parseSeizeLink(href);
    if (seizeLinkInfo) {
      return renderSeizeQuote(seizeLinkInfo, onQuoteClick);
    }

    const twitterMatch = parseTwitterLink(href);
    if (twitterMatch) {
      return renderTweetEmbed(twitterMatch, href);
    }

    if (!isValidLink(href)) {
      return <p>[invalid link]</p>;
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
    <Link className="tw-no-underline" target="_blank" href={href}>
      <Tweet id={tweetId} />
    </Link>
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
    seizeLinkInfo: SeizeLinkInfo,
    onQuoteClick: (drop: ApiDrop) => void
  ) => {
    const { waveId, serialNo, dropId } = seizeLinkInfo;

    if (serialNo) {
      return (
        <WaveDetailedDropQuoteWithSerialNo
          serialNo={parseInt(serialNo)}
          waveId={waveId}
          onQuoteClick={onQuoteClick}
        />
      );
    } else if (dropId) {
      return (
        <WaveDetailedDropQuoteWithDropId
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
      className="tw-w-full"
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
            className={`last:tw-mb-0 tw-leading-6 tw-text-iron-200 tw-font-normal tw-whitespace-pre-wrap tw-break-words word-break tw-transition tw-duration-300 tw-ease-out ${textSizeClass}`}
          >
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </p>
        ),
        li: (params) => (
          <li className="tw-text-iron-200 tw-break-words word-break">
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
            className="tw-text-iron-200 tw-whitespace-pre-wrap tw-break-words"
          >
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </code>
        ),
        a: (params) => aHrefRenderer(params),
        img: (params) => (
          <DropPartMarkdownImage
            src={params.src ?? ""}
          />
        ),
        blockquote: (params) => (
          <blockquote className="tw-text-iron-200 tw-break-words word-break tw-pl-4 tw-border-l-4 tw-border-l-iron-500 tw-border-solid tw-border-t-0 tw-border-r-0 tw-border-b-0">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </blockquote>
        ),
      }}
    >
      {partContent}
    </Markdown>
  );
}

export default memo(DropPartMarkdown);
