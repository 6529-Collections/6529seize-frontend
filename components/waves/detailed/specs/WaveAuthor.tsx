import { Wave } from "../../../../generated/models/Wave";

export default function WaveAuthor({ wave }: { readonly wave: Wave }) {
  return (
    <div className="tw-text-sm tw-flex tw-flex-col tw-gap-2">
      <span className="tw-font-medium tw-text-iron-400">Created by</span>
      <div className="tw-flex tw-items-center tw-gap-x-2">
        {wave.author.pfp ? (
          <img
            className="tw-h-6 tw-w-6 tw-rounded-lg tw-bg-iron-800"
            src={wave.author.pfp}
            alt="Profile Picture"
          />
        ) : (
          <div className="tw-h-6 tw-w-6 tw-rounded-lg tw-bg-iron-800" />
        )}
        <span className="tw-font-medium tw-text-white tw-text-base">
          {wave.author.handle}
        </span>
      </div>
    </div>
  );
}
