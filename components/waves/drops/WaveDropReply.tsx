import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { useEffect, useState } from "react";

export interface WaveDropReplyProps {
  readonly dropId: string;
  readonly dropPartId: number;
  readonly maybeDrop: ApiDrop | null;
  readonly onReplyClick: (serialNo: number) => void;
}

export default function WaveDropReply({
  dropId,
  dropPartId,
  maybeDrop,
  onReplyClick,
}: WaveDropReplyProps) {
  const {
    data: drop,
    isFetching,
    error,
  } = useQuery<ApiDrop>({
    queryKey: [QueryKey.DROP, { drop_id: dropId }],
    queryFn: async () =>
      await commonApiFetch<ApiDrop>({
        endpoint: `drops/${dropId}`,
      }),
    placeholderData: keepPreviousData,
    initialData: maybeDrop ?? undefined,
    enabled: !maybeDrop,
  });

  const removeSquareBrackets = (text: string): string => {
    return text.replace(/@\[([^\]]+)\]/g, "@$1");
  };

  const extractMediaLinks = (text: string): { 
    text: string; 
    media: Array<{ 
      alt: string; 
      url: string; 
      type: 'image' | 'video';
    }> 
  } => {
    const mediaPattern = /!\[([^\]]*)\]\(([^\)]+)\)/g;
    const media: Array<{ alt: string; url: string; type: 'image' | 'video' }> = [];
    
    // First collect all media
    let match;
    while ((match = mediaPattern.exec(text)) !== null) {
      const url = match[2];
      const type = isVideoUrl(url) ? 'video' : 'image';
      media.push({ alt: match[1], url, type });
    }
    
    // Then remove all media syntax
    const newText = text.replace(mediaPattern, '');
    
    return { text: newText.trim(), media };
  };
  
  const isVideoUrl = (url: string): boolean => {
    // Check file extension
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv'];
    const lowercaseUrl = url.toLowerCase();
    
    // Check if URL ends with a video extension
    if (videoExtensions.some(ext => lowercaseUrl.endsWith(ext))) {
      return true;
    }
    
    // Check for video hosting services
    const videoPatterns = [
      'youtube.com/watch', 
      'youtu.be/', 
      'vimeo.com/', 
      'dailymotion.com/', 
      'twitch.tv/',
      'player.vimeo.com'
    ];
    
    return videoPatterns.some(pattern => lowercaseUrl.includes(pattern));
  };

  const modifyContent = (content: string): { 
    text: string; 
    media: Array<{ alt: string; url: string; type: 'image' | 'video' }> 
  } => {
    const withoutBrackets = removeSquareBrackets(content);
    return extractMediaLinks(withoutBrackets);
  };

  const getContent = (): { 
    text: string; 
    media: Array<{ alt: string; url: string; type: 'image' | 'video' }> 
  } => {
    if (isFetching && !maybeDrop) {
      return { text: "Loading...", media: [] };
    }

    if (error) {
      const regex =
        /Drop [0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12} not found/;

      if (regex.test(JSON.stringify(error))) {
        return { text: "This drop has been deleted by the author", media: [] };
      }
      return { text: "Error loading drop", media: [] };
    }

    if (!drop) {
      return { text: "", media: [] };
    }

    const part = drop.parts.find((part) => part.part_id === dropPartId);
    if (!part) {
      return { text: "", media: [] };
    }

    if (!part.content) {
      return { text: "Media", media: [] };
    }

    return modifyContent(part.content);
  };

  const [content, setContent] = useState<{ 
    text: string; 
    media: Array<{ alt: string; url: string; type: 'image' | 'video' }> 
  }>(getContent());

  useEffect(() => {
    setContent(getContent());
  }, [drop, dropPartId, isFetching, error]);

  const renderDropContent = () => {
    if (isFetching) {
      return (
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          <div className="tw-h-6 tw-w-6 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-relative tw-flex-shrink-0 tw-rounded-md z-10">
            <div className="tw-h-full tw-w-full tw-animate-pulse tw-bg-iron-700 tw-rounded-md" />
          </div>
          <p className="tw-mb-0 tw-text-sm tw-text-iron-200 tw-font-semibold tw-animate-pulse">
            Loading...
          </p>
        </div>
      );
    }

    if (!drop?.author.handle) {
      return (
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          <div className="tw-h-6 tw-w-6 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-relative tw-flex-shrink-0 tw-rounded-md z-10">
            <div className="tw-h-full tw-w-full tw-bg-iron-800 tw-rounded-md" />
          </div>
          <p className="tw-mb-0 tw-text-sm tw-text-iron-200 tw-font-semibold">
            Drop not found
          </p>
        </div>
      );
    }

    return (
      <div className="tw-flex tw-gap-x-1.5">
        <div className="tw-h-6 tw-w-6 tw-bg-iron-800 tw-relative tw-flex-shrink-0 tw-rounded-md z-10">
          {drop.author.pfp ? (
            <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-md tw-overflow-hidden tw-bg-iron-900">
              <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-md tw-overflow-hidden">
                <img
                  src={drop.author.pfp}
                  alt={`${drop.author.handle}'s avatar`}
                  className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
                />
              </div>
            </div>
          ) : (
            <div className="tw-h-full tw-w-full tw-bg-iron-900 tw-rounded-md tw-ring-1 tw-ring-inset tw-ring-white/10" />
          )}
        </div>
        <div className="tw-flex-1">
          <p className="tw-mb-0 tw-line-clamp-2 lg:tw-line-clamp-1 xl:tw-pr-24">
            <Link
              href={`/${drop.author.handle}`}
              className="tw-no-underline tw-mr-1 tw-text-sm tw-font-medium tw-text-iron-200 hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out"
            >
              {drop.author.handle}
            </Link>
            <span
              className="tw-break-all tw-text-iron-300 tw-font-normal tw-text-sm hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-flex tw-items-center tw-gap-1"
              onClick={() =>
                drop?.serial_no && onReplyClick(drop.serial_no)
              }
            >
              {content.text}
              {content.media.map((media, i) => (
                media.type === 'image' ? (
                  <img 
                    key={i}
                    src={media.url} 
                    alt={media.alt} 
                    className="tw-inline tw-h-4 tw-w-4 tw-object-cover tw-rounded" 
                  />
                ) : (
                  <span 
                    key={i} 
                    className="tw-inline-flex tw-items-center tw-justify-center tw-h-4 tw-w-auto tw-px-1 tw-bg-iron-800 tw-rounded tw-text-xs tw-text-iron-400"
                    title={media.alt}
                  >
                    ▶
                  </span>
                )
              ))}
            </span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="tw-mb-3 tw-relative">
      <div
        className="tw-absolute tw-top-2.5 tw-left-5 tw-border-iron-700 tw-border-0 tw-border-solid tw-border-t-[1.5px] tw-border-l-[1.5px] tw-cursor-pointer tw-w-6 tw-rounded-tl-[12px]"
        style={{ height: "calc(100% - 3px)" }}
      ></div>
      <div className="tw-ml-[52px] tw-flex tw-items-center tw-gap-x-1.5">
        {renderDropContent()}
      </div>
    </div>
  );
}
