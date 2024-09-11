import { AnchorHTMLAttributes, ClassAttributes, ReactNode } from "react";
import Markdown, { ExtraProps } from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";
import { DropContentPartType } from "../item/content/DropListItemContent";
import DropListItemContentPart, {
  DropListItemContentPartProps,
} from "../item/content/DropListItemContentPart";
import { DropMentionedUser } from "../../../../generated/models/DropMentionedUser";
import { DropReferencedNFT } from "../../../../generated/models/DropReferencedNFT";

import { useRouter } from "next/router";
import { Tweet } from "react-tweet";
import Link from "next/link";
import DropPartQuote from "./quote/DropPartQuote";

interface DropPartMarkdownProps {
  readonly mentionedUsers: Array<DropMentionedUser>;
  readonly referencedNfts: Array<DropReferencedNFT>;
  readonly partContent: string | null;
  readonly onImageLoaded: () => void;
  readonly textSize?: "sm" | "md";
}

export default function DropPartMarkdown({
  mentionedUsers,
  referencedNfts,
  partContent,
  onImageLoaded,
  textSize = "md",
}: DropPartMarkdownProps) {
  const router = useRouter();
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
    onImageLoaded,
  }: {
    readonly content: ReactNode | undefined;
    readonly mentionedUsers: Array<DropMentionedUser>;
    readonly referencedNfts: Array<DropReferencedNFT>;
    readonly onImageLoaded: () => void;
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
          return (
            <DropListItemContentPart
              key={randomId}
              part={partProps}
              onImageLoaded={onImageLoaded}
            />
          );
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
    onImageLoaded,
  }: {
    readonly content: ReactNode | undefined;
    readonly mentionedUsers: Array<DropMentionedUser>;
    readonly referencedNfts: Array<DropReferencedNFT>;
    readonly onImageLoaded: () => void;
  }) => {
    if (typeof content === "string") {
      return customPartRenderer({
        content,
        mentionedUsers,
        referencedNfts,
        onImageLoaded,
      });
    }

    if (Array.isArray(content)) {
      return content.map((child) => {
        if (typeof child === "string") {
          return customPartRenderer({
            content: child,
            mentionedUsers,
            referencedNfts,
            onImageLoaded,
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

    const baseEndpoint = process.env.BASE_ENDPOINT || "";
    const regex =
      /\/waves\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\?drop=([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/;
    const match = href ? href.match(regex) : null;
    const isSeizeLink = !!match;
    const waveId = match ? match[1] : null;
    const dropId = match ? match[2] : null;

    if (isSeizeLink && dropId && waveId) {
      const onRedropClick = (redropId: string) => {
        router.push(`/waves/${waveId}?drop=${redropId}`, undefined, {
          shallow: true,
        });
      };
      return (
        <div className="tw-bg-red">
          This is a quote
        </div>
      );
    }

    const twitterRegex =
      /https:\/\/(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)/;
    const twitterMatch = href ? href.match(twitterRegex) : null;

    if (twitterMatch) {
      const tweetId = twitterMatch[3];
      return (
        <Link className="tw-no-underline" target="_blank" href={href}>
          <Tweet id={tweetId} />
        </Link>
      );
    }

    const isValidLink =
      href?.startsWith("..") || href?.startsWith("/") || !href?.includes(".");

    if (isValidLink) {
      return <p>[invalid link]</p>;
    }

    const isExternalLink =
      href && baseEndpoint && !href.startsWith(baseEndpoint);

    if (isExternalLink) {
      props.rel = "noopener noreferrer nofollow";
      props.target = "_blank";
    } else {
      props.href = href?.replace(baseEndpoint, "");
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
          <h5 className="tw-text-iron-50 tw-break-words word-break">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
              onImageLoaded,
            })}
          </h5>
        ),
        h4: (params) => (
          <h4 className="tw-text-iron-50 tw-break-words word-break">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
              onImageLoaded,
            })}
          </h4>
        ),
        h3: (params) => (
          <h3 className="tw-text-iron-50 tw-break-words word-break">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
              onImageLoaded,
            })}
          </h3>
        ),
        h2: (params) => (
          <h2 className="tw-text-iron-50 tw-break-words word-break">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
              onImageLoaded,
            })}
          </h2>
        ),
        h1: (params) => (
          <h1 className="tw-text-iron-50 tw-break-words word-break">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
              onImageLoaded,
            })}
          </h1>
        ),
        p: (params) => (
          <p
            className={`last:tw-mb-0 tw-leading-5 tw-text-iron-50 tw-font-normal tw-whitespace-pre-wrap tw-break-words word-break tw-transition tw-duration-300 tw-ease-out ${textSizeClass}`}
          >
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
              onImageLoaded,
            })}
          </p>
        ),
        li: (params) => (
          <li className="tw-text-iron-50 tw-break-words word-break">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
              onImageLoaded,
            })}
          </li>
        ),
        code: (params) => (
          <code
            style={{ textOverflow: "unset" }}
            className="tw-text-iron-50 tw-whitespace-pre-wrap tw-break-words"
          >
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
              onImageLoaded,
            })}
          </code>
        ),
        a: (params) => aHrefRenderer(params),
        img: (params) => (
          <img
            {...params}
            alt="Seize"
            onLoad={onImageLoaded}
            className="tw-w-full"
          />
        ),
      }}
    >
      {partContent}
    </Markdown>
  );
}
