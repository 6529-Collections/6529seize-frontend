import {
  AnchorHTMLAttributes,
  ClassAttributes,
  memo,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { DropFull } from "../../../../../entities/IDrop";
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

const customRenderer = ({
  content,
  drop,
}: {
  readonly content: ReactNode | undefined;
  readonly drop: DropFull;
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
        return <DropListItemContentPart key={part} part={partProps} />;
      }
      return part;
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
    readonly drop: DropFull;
    readonly showFull?: boolean;
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
      const checkOverflow = () => {
        setIsOverflowing(
          !!containerRef.current &&
            containerRef.current.scrollHeight >
              containerRef.current.clientHeight
        );
      };

      // Check overflow initially
      checkOverflow();

      // Check overflow on window resize
      window.addEventListener("resize", checkOverflow);

      // Set up a MutationObserver to check overflow when the container's content changes
      const observer = new MutationObserver(checkOverflow);
      if (containerRef.current) {
        observer.observe(containerRef.current, {
          childList: true,
          subtree: true,
        });
      }

      // Clean up event listeners and observer
      return () => {
        window.removeEventListener("resize", checkOverflow);
        observer.disconnect();
      };
    }, [containerRef]);

    const [showMore, setShowMore] = useState(showFull);

    return (
      <>
        <CommonAnimationHeight>
          <div
            ref={containerRef}
            className={`${
              !showMore ? "tw-max-h-72" : "tw-max-h-full"
            } tw-relative tw-overflow-y-hidden tw-transform tw-transition-all tw-duration-300 tw-ease-out`}
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
                    {customRenderer({ content: params.children, drop })}
                  </h5>
                ),
                h4: (params) => (
                  <h4 className="tw-text-iron-50 tw-break-words word-break">
                    {customRenderer({ content: params.children, drop })}
                  </h4>
                ),
                h3: (params) => (
                  <h3 className="tw-text-iron-50 tw-break-words word-break">
                    {customRenderer({ content: params.children, drop })}
                  </h3>
                ),
                h2: (params) => (
                  <h2 className="tw-text-iron-50 tw-break-words word-break">
                    {customRenderer({ content: params.children, drop })}
                  </h2>
                ),
                h1: (params) => (
                  <h1 className="tw-text-iron-50 tw-break-words word-break">
                    {customRenderer({ content: params.children, drop })}
                  </h1>
                ),
                p: (params) => (
                  <p className="last:tw-mb-0 tw-text-md tw-leading-6 tw-text-iron-50 tw-font-normal tw-whitespace-pre-wrap tw-break-words word-break">
                    {customRenderer({ content: params.children, drop })}
                  </p>
                ),
                li: (params) => (
                  <li className="tw-text-iron-50 tw-break-words word-break">
                    {customRenderer({ content: params.children, drop })}
                  </li>
                ),
                code: (params) => (
                  <code
                    style={{ textOverflow: "unset" }}
                    className="tw-text-iron-50 tw-whitespace-pre-wrap tw-break-words"
                  >
                    {customRenderer({ content: params.children, drop })}
                  </code>
                ),
                a: (params) => aHrefRenderer(params),
              }}
            >
              {drop.content}
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
        {!!drop.media_url && !!drop.media_mime_type && (
          <div>
            <DropListItemContentMedia
              media_mime_type={drop.media_mime_type}
              media_url={drop.media_url}
            />
          </div>
        )}
      </>
    );
  }
);

DropListItemContentMarkdown.displayName = "DropListItemContentMarkdown";
export default DropListItemContentMarkdown;
