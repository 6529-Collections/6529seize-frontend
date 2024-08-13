import { useQuery } from "@tanstack/react-query";
import { Drop } from "../../../../generated/models/Drop";
import DropPfp from "../../create/utils/DropPfp";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import { DropPartSize } from "../part/DropPart";
import DropReply from "./replies/DropReply";

export default function DropItem({
  drop,
}: {
  readonly drop: Drop;
  readonly availableCredit: number | null;
}) {
  return (
    <div>
      <div className="tw-flex tw-flex-col tw-gap-y-2">
        {!!drop.reply_to && (
          <DropReply
            dropId={drop.reply_to?.drop_id}
            partId={drop.reply_to?.drop_part_id}
          />
        )}

        <div className="tw-flex tw-items-stretch tw-gap-x-3">
          <div className="tw-flex tw-flex-col tw-gap-y-1">
            {!!drop.reply_to && (
              <div className="tw-relative tw-flex tw-justify-end tw-mb-1">
                <div className="tw-w-0.5 tw-bg-iron-700 tw-min-h-2.5 tw-left-[49%] tw-absolute -tw-top-2"></div>
                <div className="tw-h-4 tw-absolute -tw-top-6 tw-border-iron-700 tw-border-0 tw-border-solid tw-border-t-[2px] tw-border-l-[2px] tw-cursor-pointer tw-w-[calc(50%+0.5px)] tw-rounded-tl-[12px]"></div>
              </div>
            )}
            <div className="tw-h-10 tw-w-10 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-relative tw-flex-shrink-0 tw-rounded-lg z-10">
              <div className="tw-rounded-lg tw-h-full tw-w-full">
                <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-lg tw-overflow-hidden tw-bg-iron-800">
                  <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-overflow-hidden">
                    <DropPfp pfpUrl={drop.author.pfp} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="tw-h-full tw-flex tw-flex-col tw-justify-between">
            <div>
              <div>{drop.author.handle}</div>
              <div>{drop.wave.name}</div>
              <div>Lorem ipsum dolor sit amet.</div>
              <div className="tw-flex tw-gap-x-6 tw-pt-4 tw-pb-4">
                <div>reply</div>
                <div>requote</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
