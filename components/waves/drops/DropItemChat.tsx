import { removeBaseEndpoint } from "../../../helpers/Helpers";
import Link from "next/link";
import { ApiDropType } from "../../../generated/models/ApiDropType";
import { useDrop } from "../../../hooks/useDrop";
import DropListItemContentMedia from "../../drops/view/item/content/media/DropListItemContentMedia";
import { useRouter } from "next/router";
import { SingleWaveDropPosition } from "../drop/SingleWaveDropPosition";
import { SingleWaveDropVotes } from "../drop/SingleWaveDropVotes";

export default function DropItemChat({
  href,
  dropId,
}: {
  readonly href: string;
  readonly dropId: string;
}) {
  const router = useRouter();
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
    <Link className="tw-no-underline" href={relativeLink}>
      <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 hover:tw-border-iron-650 tw-p-6">
        <div className="tw-flex tw-flex-row tw-items-center tw-gap-x-3">
          <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-0">
            {title}
          </h3>
          {drop?.drop_type === ApiDropType.Participatory && (
            <SingleWaveDropPosition rank={drop.rank} />
          )}
        </div>
        {drop && (
          <>
            <Link
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/my-stream?wave=${drop.wave.id}`);
              }}
              href={`/my-stream?wave=${drop.wave.id}`}
              className="tw-mb-0 tw-text-[11px] tw-leading-0 -tw-mt-1 tw-text-iron-500 hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out tw-no-underline">
              {drop.wave.name}
            </Link>
            <SingleWaveDropVotes drop={drop} />
          </>
        )}
        {artworkMedia && (
          <div className="tw-mt-4 tw-flex tw-justify-center">
            <DropListItemContentMedia
              media_mime_type={artworkMedia.mime_type}
              media_url={artworkMedia.url}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
