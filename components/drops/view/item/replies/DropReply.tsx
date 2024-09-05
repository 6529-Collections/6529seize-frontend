import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Drop } from "../../../../../generated/models/Drop";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../services/api/common-api";
import DropPfp from "../../../create/utils/DropPfp";
import { DropPartSize } from "../../part/DropPart";
import { useEffect, useState } from "react";
import DropPartMarkdown from "../../part/DropPartMarkdown";
import { useRouter } from "next/router";

interface DropReplyPropsWithDrop {
  readonly reply: Drop;
  readonly textSize?: "sm" | "md";
}

interface DropReplyPropsWithDropId {
  readonly dropId: string;
  readonly partId: number;
  readonly textSize?: "sm" | "md";
}

export type DropReplyProps = DropReplyPropsWithDrop | DropReplyPropsWithDropId;

export default function DropReply(props: DropReplyProps) {
  const router = useRouter();
  const getDropIdAndPartId = (): { dropId: string; partId: number } | null => {
    if ("reply" in props) {
      return null;
    }

    return { dropId: props.dropId, partId: props.partId };
  };

  const params = getDropIdAndPartId();

  const {
    data: replyToDrop,
    isFetching,
    error,
  } = useQuery<Drop>({
    queryKey: [QueryKey.DROP, { drop_id: params?.dropId }],
    queryFn: async () =>
      await commonApiFetch<Drop>({
        endpoint: `drops/${params?.dropId}`,
      }),

    enabled: !!params,
    placeholderData: keepPreviousData,
  });

  const getFinalDrop = (): Drop | null => {
    if ("reply" in props) {
      return props.reply;
    }

    return replyToDrop ?? null;
  };

  const [finalDrop, setFinalDrop] = useState<Drop | null>(getFinalDrop());

  const getReplyContent = (): string => {
    if (isFetching) {
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

    if (!finalDrop) {
      return "";
    }

    const part =
      "partId" in props
        ? finalDrop.parts.find((part) => part.part_id === props.partId)
        : finalDrop.parts[0];
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

  const [replyContent, setReplyContent] = useState<string>(getReplyContent());

  useEffect(() => {
    setFinalDrop(getFinalDrop());
  }, [replyToDrop, isFetching]);

  useEffect(() => {
    setReplyContent(getReplyContent());
  }, [finalDrop, isFetching, error]);

  const onReplyClick = () => {
    router.push(
      `/waves/${finalDrop?.wave.id}?drop=${finalDrop?.id}`,
      undefined,
      {
        shallow: true,
      }
    );
  };

  return (
    <div>
      <div className="tw-ml-16 tw-flex tw-items-center tw-gap-x-1.5 tw-cursor-pointer">
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          <div className="tw-h-6 tw-w-6 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-relative tw-flex-shrink-0 tw-rounded-md z-10">
            <div className="tw-rounded-md tw-h-full tw-w-full">
              <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-md tw-overflow-hidden tw-bg-iron-800">
                <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-md tw-overflow-hidden">
                  <DropPfp
                    pfpUrl={finalDrop?.author.pfp}
                    size={DropPartSize.SMALL}
                  />
                </div>
              </div>
            </div>
          </div>
          <p className="tw-mb-0 tw-text-sm tw-text-iron-50 tw-font-semibold">
            {finalDrop?.author.handle}
          </p>
        </div>
        <div onClick={onReplyClick} className="tw-group">
          <DropPartMarkdown
            partContent={replyContent}
            mentionedUsers={finalDrop?.mentioned_users ?? []}
            referencedNfts={finalDrop?.referenced_nfts ?? []}
            onImageLoaded={() => undefined}
            textSize="sm"
          />
        </div>
      </div>
    </div>
  );
}
