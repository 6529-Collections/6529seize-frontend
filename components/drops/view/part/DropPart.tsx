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
import CommonAnimationHeight from "../../../utils/animation/CommonAnimationHeight";
import { DropContentPartType } from "../item/content/DropListItemContent";
import DropListItemContentPart, {
  DropListItemContentPartProps,
} from "../item/content/DropListItemContentPart";
import DropListItemContentMedia from "../item/content/media/DropListItemContentMedia";
import { DropMentionedUser } from "../../../../generated/models/DropMentionedUser";
import { DropReferencedNFT } from "../../../../generated/models/DropReferencedNFT";
import { ProfileMin } from "../../../../generated/models/ProfileMin";
import DropPfp from "../../create/utils/DropPfp";
import DropAuthor from "../../create/utils/author/DropAuthor";
import Link from "next/link";

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

  if (!isValidLink) {
    return <p>[invalid link]</p>;
  }
  return <a {...props} />;
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
    isFirstPart,
    isDescriptionDrop,
    waveName,
    waveImage,
    waveId,
  }: {
    readonly profile: ProfileMin;
    readonly dropTitle: string | null;
    readonly mentionedUsers: Array<DropMentionedUser>;
    readonly referencedNfts: Array<DropReferencedNFT>;
    readonly partContent: string | null;
    readonly partMedia: {
      readonly mimeType: string;
      readonly mediaSrc: string;
    } | null;
    readonly showFull?: boolean;
    readonly createdAt: number;
    readonly isFirstPart: boolean;
    readonly isDescriptionDrop: boolean;
    readonly waveName: string;
    readonly waveImage: string | null;
    readonly waveId: string | null;
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const checkOverflow = () => {
      setIsOverflowing(
        !!containerRef.current &&
          containerRef.current.scrollHeight > containerRef.current.clientHeight
      );
    };

    useEffect(() => {
      checkOverflow();
    }, [containerRef]);

    const [showMore, setShowMore] = useState(showFull);

    useEffect(() => {
      if (showFull) {
        setShowMore(true);
      }
    }, [showFull]);

    const [containerHeight, setContainerHeight] = useState(288);

    useEffect(() => {
      if (showMore) {
        containerRef.current?.style.setProperty("max-height", "100%");
      } else {
        containerRef.current?.style.setProperty(
          "max-height",
          `${containerHeight}px`
        );
      }
    }, [showMore, containerRef, containerHeight]);

    const onImageLoaded = () => {
      if (!containerRef.current) return;
      const imgs = containerRef.current.querySelectorAll("img");
      if (imgs.length) {
        const firstImg = imgs[0];
        if (firstImg.complete) {
          const imgRect = firstImg.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          const isTopVisible = imgRect.top <= containerRect.bottom;
          if (isTopVisible) {
            setContainerHeight(288 + firstImg.height + 288);
          }
        }
      }
    };

    return (
      <>
        <CommonAnimationHeight onAnimationCompleted={checkOverflow}>
          <div
            ref={containerRef}
            className="tw-relative tw-overflow-y-hidden tw-transform tw-transition-all tw-duration-300 tw-ease-out"
          >
            {isDescriptionDrop && (
              <div className="tw-inline-flex tw-items-center tw-gap-x-1 tw-text-xs tw-font-medium tw-text-iron-400">
                <svg
                  className="tw-size-5 tw-text-iron-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.0004 15L12.0004 22M8.00043 7.30813V9.43875C8.00043 9.64677 8.00043 9.75078 7.98001 9.85026C7.9619 9.93852 7.93194 10.0239 7.89095 10.1042C7.84474 10.1946 7.77977 10.2758 7.64982 10.4383L6.08004 12.4005C5.4143 13.2327 5.08143 13.6487 5.08106 13.9989C5.08073 14.3035 5.21919 14.5916 5.4572 14.7815C5.73088 15 6.26373 15 7.32943 15H16.6714C17.7371 15 18.27 15 18.5437 14.7815C18.7817 14.5916 18.9201 14.3035 18.9198 13.9989C18.9194 13.6487 18.5866 13.2327 17.9208 12.4005L16.351 10.4383C16.2211 10.2758 16.1561 10.1946 16.1099 10.1042C16.0689 10.0239 16.039 9.93852 16.0208 9.85026C16.0004 9.75078 16.0004 9.64677 16.0004 9.43875V7.30813C16.0004 7.19301 16.0004 7.13544 16.0069 7.07868C16.0127 7.02825 16.0223 6.97833 16.0357 6.92937C16.0507 6.87424 16.0721 6.8208 16.1149 6.71391L17.1227 4.19423C17.4168 3.45914 17.5638 3.09159 17.5025 2.79655C17.4489 2.53853 17.2956 2.31211 17.0759 2.1665C16.8247 2 16.4289 2 15.6372 2H8.36368C7.57197 2 7.17611 2 6.92494 2.1665C6.70529 2.31211 6.55199 2.53853 6.49838 2.79655C6.43707 3.09159 6.58408 3.45914 6.87812 4.19423L7.88599 6.71391C7.92875 6.8208 7.95013 6.87424 7.96517 6.92937C7.97853 6.97833 7.98814 7.02825 7.99392 7.07868C8.00043 7.13544 8.00043 7.19301 8.00043 7.30813Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Description Drop</span>
              </div>
            )}
            <div className="tw-pt-2 tw-flex tw-gap-x-3 tw-h-full">
              <div className="tw-hidden sm:tw-block">
                <DropPfp
                  pfpUrl={profile.pfp}
                  isWaveDescriptionDrop={isDescriptionDrop}
                />
              </div>
              <div className="tw-flex tw-flex-col tw-w-full tw-h-full">
                <div className="tw-flex tw-gap-x-3">
                  <div className="sm:tw-hidden">
                    <DropPfp
                      pfpUrl={profile.pfp}
                      isWaveDescriptionDrop={isDescriptionDrop}
                    />
                  </div>
                  <div className="tw-flex tw-flex-col">
                    <div className="tw-w-full tw-inline-flex tw-justify-between">
                      <DropAuthor profile={profile} timestamp={createdAt} />
                    </div>
                    {isFirstPart && (
                      <>
                        {waveId ? (
                          <Link
                            href={`waves/${waveId}`}
                            className="tw-no-underline tw-flex tw-gap-x-1 tw-items-center"
                          >
                            {waveImage && (
                              <div className="tw-h-6 tw-w-6">
                                <img
                                  src={waveImage}
                                  alt="#"
                                  className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain tw-rounded-lg"
                                />
                              </div>
                            )}
                            {/*    <div className="tw-text-xs tw-font-normal tw-text-primary-300">
                              {waveName}
                            </div>  */}
                          </Link>
                        ) : (
                          <div className="tw-no-underline tw-flex tw-gap-x-1 tw-items-center">
                            {waveImage && (
                              <div className="tw-h-6 tw-w-6">
                                <img
                                  src={waveImage}
                                  alt="#"
                                  className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain tw-rounded-lg"
                                />
                              </div>
                            )}
                            <div className="tw-text-xs tw-font-normal tw-text-primary-300">
                              {waveName}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="tw-mt-2 lg:tw-mt-1 tw-h-full">
                  {dropTitle && isFirstPart && (
                    <p className="tw-font-semibold tw-text-indigo-400 tw-text-md tw-mb-1">
                      {dropTitle}
                    </p>
                  )}
                  <div className="tw-h-full">
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
                          <p className="last:tw-mb-0 tw-text-md tw-leading-6 tw-text-iron-50 tw-font-normal tw-whitespace-pre-wrap tw-break-words word-break tw-text-balance">
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
                      }}
                    >
                      {partContent}
                    </Markdown>
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
        {!!partMedia?.mediaSrc && !!partMedia?.mimeType && (
          <div>
            <DropListItemContentMedia
              media_mime_type={partMedia.mimeType}
              media_url={partMedia.mediaSrc}
            />
          </div>
        )}
      </>
    );
  }
);

DropPart.displayName = "DropPart";
export default DropPart;
