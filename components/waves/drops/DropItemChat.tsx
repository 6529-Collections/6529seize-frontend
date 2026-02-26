import Link from "next/link";

import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { removeBaseEndpoint } from "@/helpers/Helpers";
import { useDrop } from "@/hooks/useDrop";

import ChatItemHrefButtons from "../ChatItemHrefButtons";
import { SingleWaveDropPosition } from "../drop/SingleWaveDropPosition";
import { SingleWaveDropVotes } from "../drop/SingleWaveDropVotes";

export default function DropItemChat({
  href,
  dropId,
}: {
  readonly href: string;
  readonly dropId: string;
}) {
  const { isMemesSubmission } = useSeizeSettings();
  const { drop } = useDrop({ dropId });
  const relativeLink = removeBaseEndpoint(href);
  const artworkMedia = drop?.parts?.at(0)?.media?.at(0);

  const title =
    drop?.metadata?.find((m) => m.data_key === "title")?.data_value ||
    drop?.title;

  if (!drop) {
    return <Link href={relativeLink}>{href}</Link>;
  }

  return (
    <div className="tw-flex tw-w-full tw-items-stretch tw-gap-x-1">
      <div className="tw-min-w-0 tw-flex-1">
        <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-p-4">
          <div className="tw-flex tw-flex-row tw-items-center tw-gap-x-4">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              {isMemesSubmission(drop) && (
                <MediaTypeBadge
                  mimeType={artworkMedia?.mime_type}
                  dropId={drop.id}
                  size="sm"
                />
              )}
              <h3 className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-100 sm:tw-text-lg">
                <Link className="tw-no-underline" href={relativeLink}>
                  {title}
                </Link>
              </h3>
            </div>
            {drop?.drop_type === ApiDropType.Participatory && (
              <SingleWaveDropPosition rank={drop.rank} />
            )}
          </div>
          {drop && (
            <>
              <span className="tw-leading-0 -tw-mt-1 tw-mb-0 tw-text-[11px] tw-text-iron-500 tw-no-underline tw-transition tw-duration-300 tw-ease-out">
                <Link className="tw-no-underline" href={relativeLink}>
                  {drop.wave.name}
                </Link>
              </span>
              <SingleWaveDropVotes drop={drop} />
            </>
          )}
          {artworkMedia && (
            <div className="tw-mt-4 tw-flex tw-h-96 tw-justify-center">
              <DropListItemContentMedia
                media_mime_type={artworkMedia.mime_type}
                media_url={artworkMedia.url}
                isCompetitionDrop={
                  drop.drop_type === ApiDropType.Participatory ||
                  drop.drop_type === ApiDropType.Winner
                }
              />
            </div>
          )}
        </div>
      </div>
      <ChatItemHrefButtons href={href} relativeHref={relativeLink} />
    </div>
  );
}
