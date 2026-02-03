import Link from "next/link";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";

export default function DropListItemContentWaveMention({
  wave,
}: {
  readonly wave: ApiMentionedWave;
}) {
  return (
    <Link
      onClick={(e) => e.stopPropagation()}
      href={`/waves?wave=${wave.wave_id}`}
      className="tw-align-middle tw-font-medium tw-text-primary-400 tw-no-underline tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-primary-300 desktop-hover:hover:tw-underline"
    >
      #{wave.wave_name_in_content}
    </Link>
  );
}
