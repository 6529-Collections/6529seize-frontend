"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { convertApiDropToExtendedDrop } from "@/helpers/waves/drop.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import Drop, { DropLocation } from "@/components/waves/drops/Drop";
import WaveDropBookmarkAction from "@/components/waves/drops/WaveDropBookmarkAction";
const hasConversation = ({
  wave,
  serial_no,
}: {
  readonly wave?: unknown;
  readonly serial_no?: unknown;
}) =>
  typeof wave === "object" &&
  wave !== null &&
  "id" in wave &&
  typeof wave.id === "string" &&
  wave.id.length > 0 &&
  typeof serial_no === "number" &&
  Number.isSafeInteger(serial_no);

export default function BookmarkCard({
  apiDrop,
  onRemoved,
}: {
  readonly apiDrop: ApiDrop;
  readonly onRemoved: () => void;
}) {
  const router = useRouter();
  const locale = useBrowserLocale();
  if (!hasConversation(apiDrop)) return null;
  const drop = convertApiDropToExtendedDrop(apiDrop);
  const href = getWaveRoute({
    waveId: drop.wave.id,
    serialNo: drop.serial_no,
    isDirectMessage: drop.wave.is_direct_message === true,
    isApp: false,
  });
  const open = () => router.push(href);
  return (
    <article className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950">
      <Drop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo
        activeDrop={null}
        showReplyAndQuote={false}
        location={DropLocation.MY_STREAM}
        dropViewDropId={null}
        onReply={open}
        onReplyClick={open}
        onQuoteClick={open}
        showInteractions={false}
      />
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-p-3">
        <Link
          href={href}
          className="tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-primary-400 tw-no-underline hover:tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-primary-400"
        >
          {t(locale, "bookmarks.open")}
        </Link>
        <div>
          <WaveDropBookmarkAction
            dropId={drop.id}
            knownBookmarked
            onSelected={onRemoved}
          />
        </div>
      </div>
    </article>
  );
}
