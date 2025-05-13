import {
  parseSeizeQueryLink,
  parseSeizeQuoteLink,
  SeizeQuoteLinkInfo,
} from "../../../../helpers/SeizeLinkParser";
import GroupCardChat from "../../../groups/page/list/card/GroupCardChat";
import WaveItemChat from "../../../waves/list/WaveItemChat";
import DropItemChat from "../../../waves/drops/DropItemChat";
import { Tweet } from "react-tweet";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import WaveDropQuoteWithSerialNo from "../../../waves/drops/WaveDropQuoteWithSerialNo";
import WaveDropQuoteWithDropId from "../../../waves/drops/WaveDropQuoteWithDropId";
import Link from "next/link";
import { faCopy, faLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type SmartLinkHandler<T> = {
  parse: (href: string) => T | null;
  render: (
    result: T,
    href: string,
    onQuoteClick: (drop: ApiDrop) => void
  ) => JSX.Element | null;
};

const parseTwitterLink = (
  href: string
): { href: string; tweetId: string } | null => {
  const twitterRegex =
    /https:\/\/(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)/;
  const match = href.match(twitterRegex);
  return match ? { href, tweetId: match[3] } : null;
};

export const parseGifLink = (href: string): string | null => {
  const gifRegex = /^https?:\/\/media\.tenor\.com\/[^\s]+\.gif$/i;
  return gifRegex.test(href) ? href : null;
};

const parseYouTubeLink = (
  href: string
): { href: string; videoId: string } | null => {
  const match = href.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([0-9A-Za-z_-]{11})/
  );
  return match ? { href, videoId: match[1] } : null;
};

const parseTwitchLink = (
  href: string
): { href: string; videoId: string; type: "video" | "clip" } | null => {
  const clipMatch = href.match(/twitch\.tv\/.*\/clip\/(\w+)/);
  if (clipMatch) {
    return { href, videoId: clipMatch[1], type: "clip" };
  }

  const vodMatch = href.match(/twitch\.tv\/videos\/(\d+)/);
  if (vodMatch) {
    return { href, videoId: vodMatch[1], type: "video" };
  }

  return null;
};

const renderTweetEmbed = (result: { href: string; tweetId: string }) => (
  <div className="tw-flex tw-min-w-0 tw-justify-center" data-theme="dark">
    <Tweet id={result.tweetId} />
  </div>
);

const renderGifEmbed = (url: string) => (
  <img
    src={url}
    alt={url}
    className="tw-max-h-[25rem] tw-max-w-[100%] tw-h-auto"
  />
);

const renderSeizeQuote = (
  quoteLinkInfo: SeizeQuoteLinkInfo,
  onQuoteClick: (drop: ApiDrop) => void,
  href: string
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

const renderYouTubeEmbed = (result: { href: string; videoId: string }) => {
  const { href, videoId } = result;
  return renderIFrameEmbed({
    href,
    frameSrc: `https://www.youtube.com/embed/${videoId}`,
  });
};

const renderTwitchEmbed = (result: {
  href: string;
  videoId: string;
  type: "video" | "clip";
}) => {
  const embedUrl =
    result.type === "clip"
      ? `https://clips.twitch.tv/embed?clip=${result.videoId}&parent=${window.location.hostname}`
      : `https://player.twitch.tv/?video=${result.videoId}&parent=${window.location.hostname}&autoplay=false`;

  return renderIFrameEmbed({
    href: result.href,
    frameSrc: embedUrl,
  });
};

const renderIFrameEmbed = (result: { href: string; frameSrc: string }) => (
  <div className="tw-w-full tw-aspect-video tw-relative tw-overflow-hidden tw-rounded-lg">
    <iframe
      className="tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-full"
      src={result.frameSrc}
      title="Embedded content"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  </div>
);

export const smartLinkHandlers: SmartLinkHandler<any>[] = [
  {
    parse: parseSeizeQuoteLink,
    render: (
      result: SeizeQuoteLinkInfo,
      href: string,
      onQuoteClick: (drop: ApiDrop) => void
    ) => renderSeizeQuote(result, onQuoteClick, href),
  },
  {
    parse: (href: string) => parseSeizeQueryLink(href, "/network", ["group"]),
    render: (result: { group: string }, href: string) => (
      <GroupCardChat href={href} groupId={result.group} />
    ),
  },
  {
    parse: (href: string) =>
      parseSeizeQueryLink(href, "/my-stream", ["wave"], true),
    render: (result: { wave: string }, href: string) => (
      <WaveItemChat href={href} waveId={result.wave} />
    ),
  },
  {
    parse: (href: string) =>
      parseSeizeQueryLink(href, "/my-stream", ["wave", "drop"], true),
    render: (result: { drop: string }, href: string) => (
      <DropItemChat href={href} dropId={result.drop} />
    ),
  },
  {
    parse: parseTwitterLink,
    render: (result: { href: string; tweetId: string }) =>
      renderTweetEmbed(result),
  },
  {
    parse: parseGifLink,
    render: (url: string) => renderGifEmbed(url),
  },
  {
    parse: parseYouTubeLink,
    render: renderYouTubeEmbed,
  },
  {
    parse: parseTwitchLink,
    render: renderTwitchEmbed,
  },
];

export function LinkText({
  href,
  relativeHref,
}: {
  href: string;
  relativeHref?: string;
}) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(href);
  };

  return (
    <div className="tw-flex tw-flex-row tw-gap-x-2 tw-items-center">
      <Link
        href={relativeHref ?? href}
        target={relativeHref ? undefined : "_blank"}
        className="tw-text-iron-200 tw-text-sm">
        {href}
      </Link>
      <FontAwesomeIcon
        icon={faLink}
        className="tw-w-4 tw-h-4 tw-cursor-pointer tw-text-xs tw-text-iron-200 hover:tw-text-iron-400"
        onClick={copyToClipboard}
      />
    </div>
  );
}
