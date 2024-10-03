import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Drop } from "../../../../generated/models/Drop";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import { useEffect, useState } from "react";
import WaveDetailedDropReplyAuthor from "./WaveDetailedDropReplyAuthor";
import DropPartMarkdownWithPropLogger from "../../../drops/view/part/DropPartMarkdownWithPropLogger";

export interface WaveDetailedDropReplyProps {
  readonly dropId: string;
  readonly dropPartId: number;
  readonly maybeDrop: Drop | null;
  readonly onReplyClick: (serialNo: number) => void;
}

export default function WaveDetailedDropReply({
  dropId,
  dropPartId,
  maybeDrop,
  onReplyClick,
}: WaveDetailedDropReplyProps) {
  const {
    data: drop,
    isFetching,
    error,
  } = useQuery<Drop>({
    queryKey: [QueryKey.DROP, { drop_id: dropId }],
    queryFn: async () =>
      await commonApiFetch<Drop>({
        endpoint: `drops/${dropId}`,
      }),
    placeholderData: keepPreviousData,
    initialData: maybeDrop ?? undefined,
    enabled: !maybeDrop,
  });

  const getContent = (): string => {
    if (isFetching && !maybeDrop) {
      return "Loading...";
    }

    if (error) {
      const regex =
        /Drop [0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12} not found/;

      if (regex.test(JSON.stringify(error))) {
        return "This drop has been deleted by the author";
      }
      return "Error loading drop";
    }

    if (!drop) {
      return "";
    }

    const part = drop.parts.find((part) => part.part_id === dropPartId);
    if (!part) {
      return "";
    }

    if (!part.content) {
      return "Media";
    }

    const urlRegex = /https?:\/\/[^\s]+/g;
    const content = part.content
      .replace(urlRegex, "[link]")
      .slice(0, 50)
      .replace(/\n/g, " ");

    return part.content.length > 50 ? content + "..." : content;
  };

  const [content, setContent] = useState<string>(getContent());

  useEffect(() => {
    setContent(getContent());
  }, [drop, dropPartId, isFetching, error]);

  return (
    <div className="tw-mb-4 tw-relative">
      <div
        className="tw-absolute tw-top-2.5 tw-left-5 tw-border-iron-700 tw-border-0 tw-border-solid tw-border-t-[1.5px] tw-border-l-[1.5px] tw-cursor-pointer tw-w-6 tw-rounded-tl-[12px]"
        style={{ height: "calc(100% - 2px)" }}
      ></div>
      <div className="tw-ml-[52px] tw-flex tw-items-center tw-gap-x-1.5">
        <WaveDetailedDropReplyAuthor isFetching={false} drop={drop} />

        <button
          onClick={() => drop?.serial_no && onReplyClick(drop.serial_no)}
          className="tw-min-w-0 tw-w-full tw-text-left tw-bg-transparent tw-border-none tw-p-0 tw-m-0 tw-cursor-pointer"
        >
          <p className="tw-mb-0 tw-leading-5 tw-text-iron-200 tw-font-normal tw-text-sm tw-truncate">
            {content}
          </p>

          <DropPartMarkdownWithPropLogger
            partContent={content}
            mentionedUsers={drop?.mentioned_users ?? []}
            referencedNfts={drop?.referenced_nfts ?? []}
            onImageLoaded={() => undefined}
            textSize="sm"
          />
        </button>
      </div>
    </div>
  );
}
