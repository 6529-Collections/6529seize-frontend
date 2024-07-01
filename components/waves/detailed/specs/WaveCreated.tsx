import { Wave } from "../../../../generated/models/Wave";
import { getTimeAgo } from "../../../../helpers/Helpers";

export default function WaveCreated({ wave }: { readonly wave: Wave }) {
  const created = getTimeAgo(wave.created_at);
  return (
    <div className="tw-text-sm tw-flex tw-flex-col tw-gap-2">
      <span className="tw-font-medium tw-text-iron-400">Created</span>
      <span className="tw-font-medium tw-text-white tw-text-base">
        {created}
      </span>
    </div>
  );
}
