import Link from "next/link";
import { Wave } from "../../../../generated/models/Wave";

export default function WaveAuthor({ wave }: { readonly wave: Wave }) {
  return (
    <div className="tw-text-sm tw-flex tw-flex-col tw-gap-2">
      <span className="tw-font-medium tw-text-iron-400">Created by</span>
      <Link
        href={`/${wave.author.handle}`}
        className="tw-no-underline hover:tw-underline hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-gap-x-2"
      >
        {wave.author.pfp ? (
          <img
            className="tw-h-6 tw-w-6 tw-rounded-lg tw-bg-iron-800"
            src={wave.author.pfp}
            alt="Profile Picture"
          />
        ) : (
          <div className="tw-h-6 tw-w-6 tw-rounded-lg tw-bg-iron-800" />
        )}
        <span className="tw-font-medium t tw-text-base">
          {wave.author.handle}
        </span>
      </Link>
    </div>
  );
}
