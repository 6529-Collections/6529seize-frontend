import {
  ReactNode,
  ClassAttributes,
  AnchorHTMLAttributes,
  memo,
  useRef,
  useState,
  useEffect,
} from "react";
import Markdown, { ExtraProps } from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";
import { DropContentPartType } from "../item/content/DropListItemContent";
import DropListItemContentPart, {
  DropListItemContentPartProps,
} from "../item/content/DropListItemContentPart";
import DropListItemContentMedia from "../item/content/media/DropListItemContentMedia";
import { DropMentionedUser } from "../../../../generated/models/DropMentionedUser";
import { DropReferencedNFT } from "../../../../generated/models/DropReferencedNFT";
import DropPfp from "../../create/utils/DropPfp";
import DropAuthor from "../../create/utils/author/DropAuthor";
import Link from "next/link";
import { ProfileMinWithoutSubs } from "../../../../helpers/ProfileTypes";
import CommonAnimationHeight from "../../../utils/animation/CommonAnimationHeight";

export enum DropPartSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
}

export interface DropPartPropsMedia {
  readonly mimeType: string;
  readonly mediaSrc: string;
}

export interface DropPartPropsWave {
  readonly id: string | null;
  readonly name: string;
  readonly image: string | null;
}

export interface DropPartProps {
  readonly profile: ProfileMinWithoutSubs;
  readonly dropTitle: string | null;
  readonly mentionedUsers: Array<DropMentionedUser>;
  readonly referencedNfts: Array<DropReferencedNFT>;
  readonly partContent: string | null;
  readonly partMedia: DropPartPropsMedia | null;
  readonly createdAt: number;
  readonly wave: DropPartPropsWave | null;
  readonly showFull?: boolean;
  readonly size?: DropPartSize;
  readonly totalPartsCount?: number;
  readonly currentPartCount?: number;
  readonly smallMenuIsShown: boolean;
  readonly components?: {
    readonly authorFollow?: ReactNode;
  };
  readonly onNextPart?: () => void;
  readonly onPrevPart?: () => void;
  readonly onContentClick?: () => void;
}

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

const aHrefRenderer = ({
  node,
  ...props
}: ClassAttributes<HTMLAnchorElement> &
  AnchorHTMLAttributes<HTMLAnchorElement> &
  ExtraProps) => {
  const { href } = props;
  const isValidLink =
    href?.startsWith("..") || href?.startsWith("/") || !href?.includes(".");

  if (isValidLink) {
    return <p>[invalid link]</p>;
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

const DropPart = memo(
  ({
    profile,
    mentionedUsers,
    referencedNfts,
    partContent,
    partMedia,
    showFull = false,
    dropTitle,
    createdAt,
    wave,
    size = DropPartSize.MEDIUM,
    totalPartsCount,
    currentPartCount,
    components,
    smallMenuIsShown,
    onNextPart,
    onPrevPart,
    onContentClick,
  }: DropPartProps) => {
    const isStorm = totalPartsCount && totalPartsCount > 1;
    const showPrevButton = currentPartCount && currentPartCount > 1;
    const showNextButton =
      currentPartCount && totalPartsCount && currentPartCount < totalPartsCount;
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const checkOverflow = () => {
      setIsOverflowing(
        !!contentRef.current &&
          contentRef.current.scrollHeight > contentRef.current.clientHeight
      );
    };

    useEffect(() => {
      checkOverflow();
    }, [contentRef]);

    const [showMore, setShowMore] = useState(showFull);

    useEffect(() => {
      if (showFull) {
        setShowMore(true);
      }
    }, [showFull]);

    const [containerHeight, setContainerHeight] = useState(288);

    useEffect(() => {
      if (showMore) {
        contentRef.current?.style.setProperty("max-height", "100%");
      } else {
        contentRef.current?.style.setProperty(
          "max-height",
          `${containerHeight}px`
        );
      }
    }, [showMore, contentRef, containerHeight]);

    const onImageLoaded = () => {
      if (!contentRef.current) return;
      const imgs = contentRef.current.querySelectorAll("img");
      if (imgs.length) {
        const firstImg = imgs[0];
        if (firstImg.complete) {
          const imgRect = firstImg.getBoundingClientRect();
          const containerRect = contentRef.current.getBoundingClientRect();
          const isTopVisible = imgRect.top <= containerRect.bottom;
          if (isTopVisible) {
            setContainerHeight(288 + firstImg.height + 288);
          }
        }
      }
    };

    return (
      <CommonAnimationHeight onAnimationCompleted={checkOverflow}>
        <div
          ref={containerRef}
          className="tw-relative tw-overflow-hidden tw-transform tw-transition-all tw-duration-300 tw-ease-out"
        >
          <div className="tw-pt-2 tw-flex tw-gap-x-3 tw-h-full">
            <div className="tw-flex tw-flex-col tw-w-full tw-h-full tw-self-center sm:tw-self-start">
              <div className={`${smallMenuIsShown && ""} tw-flex tw-gap-x-3`}>
                <DropPfp pfpUrl={profile.pfp} size={size} />
                <div className="tw-w-full tw-h-10 tw-flex tw-flex-col tw-justify-between">
                  <DropAuthor
                    profile={profile}
                    timestamp={createdAt}
                    size={size}
                  >
                    {components?.authorFollow}
                  </DropAuthor>
                  <div className="tw-mt-1 tw-inline-flex tw-items-center tw-justify-between">
                    {wave?.id && (
                      <Link
                        onClick={(e) => e.stopPropagation()}
                        href={`/waves/${wave.id}`}
                        className="tw-mb-0 tw-pb-0 tw-no-underline tw-text-xs tw-text-iron-400 hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out"
                      >
                        <span>{wave.name}</span>
                      </Link>
                    )}
                    {isStorm && (
                      <div className="tw-inline-flex tw-relative">
                        <svg
                          className="tw-h-4 tw-w-4 tw-mr-2 tw-text-yellow"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M21 4H3M20 8L6 8M18 12L9 12M15 16L8 16M17 20H12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="tw-text-xs tw-text-iron-50">
                          {currentPartCount} /{" "}
                          <span className="tw-text-iron-400">
                            {totalPartsCount}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div
                onClick={(e) => {
                  if (onContentClick) {
                    const selection = window.getSelection();
                    if (selection?.toString().length) {
                      return;
                    }

                    e.stopPropagation();
                    onContentClick();
                  }
                }}
                className={`${
                  onContentClick && "tw-cursor-pointer"
                } tw-mt-2 tw-h-full`}
              >
                {dropTitle && (
                  <p className="tw-font-semibold tw-text-primary-400 tw-text-md tw-mb-1">
                    {dropTitle}
                  </p>
                )}
                <div className="tw-w-full tw-inline-flex tw-justify-between tw-space-x-2">
                  {onPrevPart && isStorm && (
                    <button
                      disabled={!showPrevButton}
                      className={`${
                        showPrevButton
                          ? "tw-text-iron-300 hover:tw-text-primary-400"
                          : "tw-text-iron-700 tw-cursor-default"
                      } tw-bg-transparent tw-rounded-lg tw-border-0 tw-transition tw-duration-300 tw-ease-out`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPrevPart();
                      }}
                    >
                      <svg
                        className="tw-size-5 tw-flex-shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 19.5 8.25 12l7.5-7.5"
                        />
                      </svg>
                    </button>
                  )}
                  <div
                    className={`${isStorm && ""} tw-h-full tw-w-full`}
                    ref={contentRef}
                  >
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
                          <p className="last:tw-mb-0 tw-text-md tw-leading-5 tw-text-iron-50 tw-font-normal tw-whitespace-pre-wrap tw-break-words word-break">
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
                    {!!partMedia?.mediaSrc && !!partMedia?.mimeType && (
                      <div className={partContent ? "tw-mt-4" : "tw-mt-1"}>
                        <DropListItemContentMedia
                          media_mime_type={partMedia.mimeType}
                          media_url={partMedia.mediaSrc}
                          onImageLoaded={onImageLoaded}
                        />
                      </div>
                    )}
                  </div>
                  {onNextPart && isStorm && (
                    <button
                      className={`${
                        showNextButton
                          ? "tw-text-iron-300 hover:tw-text-primary-400"
                          : "tw-text-iron-700 tw-cursor-default"
                      } tw-bg-transparent tw-rounded-lg tw-border-0 tw-transition tw-duration-300 tw-ease-out`}
                      disabled={!showNextButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        onNextPart();
                      }}
                    >
                      <svg
                        className="tw-size-5 tw-flex-shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m8.25 4.5 7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isOverflowing && !showMore && (
            <div className="tw-bg-gradient-to-t tw-from-iron-900 tw-h-48 tw-absolute tw-inset-x-0 tw-bottom-0">
              <div className="tw-h-full tw-flex tw-flex-col tw-items-center tw-justify-end">
                <div className="tw-flex tw-items-center tw-gap-x-2">
                  <button
                    onClick={() => setShowMore(!showMore)}
                    type="button"
                    className="tw-relative tw-shadow tw-text-xs tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-700 tw-px-2 tw-py-1.5 tw-text-iron-200 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
                  >
                    Show full drop
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CommonAnimationHeight>
    );
  }
);

DropPart.displayName = "DropPart";
export default DropPart;
