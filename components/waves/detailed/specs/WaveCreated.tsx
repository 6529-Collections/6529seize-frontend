import { Wave } from "../../../../generated/models/Wave";
import { getTimeAgo } from "../../../../helpers/Helpers";

export default function WaveCreated({ wave }: { readonly wave: Wave }) {
  const created = getTimeAgo(wave.created_at);
  return (
    <div className="tw-text-sm">
      <span className="tw-font-normal tw-text-iron-400 tw-pr-1">Created</span>
      <span className="tw-font-normal tw-text-iron-300">
        {created}
      </span>
    </div>
  );
}
