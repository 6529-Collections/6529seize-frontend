import {
  AnchorHTMLAttributes,
  ClassAttributes,
  memo,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import Markdown, { ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";
import DropListItemContentPart, {
  DropListItemContentPartProps,
} from "./DropListItemContentPart";
import { DropContentPartType } from "./DropListItemContent";
import DropListItemContentMedia from "./media/DropListItemContentMedia";
import CommonAnimationHeight from "../../../../utils/animation/CommonAnimationHeight";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSanitize from "rehype-sanitize";
import { Drop } from "../../../../../generated/models/Drop";

const customRenderer = ({
  content,
  drop,
  onImageLoaded,
}: {
  readonly content: ReactNode | undefined;
  readonly drop: Drop;
  readonly onImageLoaded: () => void;
}) => {
  if (typeof content !== "string") {
    return content;
  }

  const splitter = getRandomObjectId();

  const values: Record<string, DropListItemContentPartProps> = {
    ...drop.mentioned_users.reduce(
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
    ...drop.referenced_nfts.reduce(
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

const DropListItemContentMarkdown = memo(
  ({
    drop,
    showFull = false,
  }: {
    readonly drop: Drop;
    readonly showFull?: boolean;
  }) => {
    // TODO make it multiple parts
    const part = drop.parts[0];

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

    const dropMedia = part.media?.at(0);

    return (
      <>
        <CommonAnimationHeight onAnimationCompleted={checkOverflow}>
          <div
            ref={containerRef}
            className="tw-relative tw-overflow-y-hidden tw-transform tw-transition-all tw-duration-300 tw-ease-out"
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
                      drop,
                      onImageLoaded,
                    })}
                  </h5>
                ),
                h4: (params) => (
                  <h4 className="tw-text-iron-50 tw-break-words word-break">
                    {customRenderer({
                      content: params.children,
                      drop,
                      onImageLoaded,
                    })}
                  </h4>
                ),
                h3: (params) => (
                  <h3 className="tw-text-iron-50 tw-break-words word-break">
                    {customRenderer({
                      content: params.children,
                      drop,
                      onImageLoaded,
                    })}
                  </h3>
                ),
                h2: (params) => (
                  <h2 className="tw-text-iron-50 tw-break-words word-break">
                    {customRenderer({
                      content: params.children,
                      drop,
                      onImageLoaded,
                    })}
                  </h2>
                ),
                h1: (params) => (
                  <h1 className="tw-text-iron-50 tw-break-words word-break">
                    {customRenderer({
                      content: params.children,
                      drop,
                      onImageLoaded,
                    })}
                  </h1>
                ),
                p: (params) => (
                  <p className="last:tw-mb-0 tw-text-md tw-leading-6 tw-text-iron-50 tw-font-normal tw-whitespace-pre-wrap tw-break-words word-break">
                    {customRenderer({
                      content: params.children,
                      drop,
                      onImageLoaded,
                    })}
                  </p>
                ),
                li: (params) => (
                  <li className="tw-text-iron-50 tw-break-words word-break">
                    {customRenderer({
                      content: params.children,
                      drop,
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
                      drop,
                      onImageLoaded,
                    })}
                  </code>
                ),
                a: (params) => aHrefRenderer(params),
              }}
            >
              {part.content}
            </Markdown>

            {isOverflowing && !showMore && (
              <div className="tw-bg-gradient-to-t tw-from-iron-900 tw-h-48 tw-absolute tw-inset-x-0 tw-bottom-0">
                <div className="tw-h-full tw-flex tw-flex-col tw-items-center tw-justify-end">
                  <button
                    onClick={() => setShowMore(!showMore)}
                    type="button"
                    className="tw-relative tw-shadow tw-text-xs tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-700 tw-px-2 tw-py-1.5 tw-text-iron-200 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
                  >
                    Show full drop
                  </button>
                </div>
              </div>
            )}
          </div>
        </CommonAnimationHeight>
        {!!dropMedia?.url && !!dropMedia?.mime_type && (
          <div>
            <DropListItemContentMedia
              media_mime_type={dropMedia.mime_type}
              media_url={dropMedia.url}
            />
          </div>
        )}
      </>
    );
  }
);

DropListItemContentMarkdown.displayName = "DropListItemContentMarkdown";
export default DropListItemContentMarkdown;
