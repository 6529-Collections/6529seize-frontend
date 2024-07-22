import { Wave } from "../../../generated/models/Wave";
import { getTimeUntil } from "../../../helpers/Helpers";

export default function WaveItemEnding({ wave }: { readonly wave: Wave }) {
  const ending = wave.wave.period?.max;
  const haveEnding = !!ending;
  const isPast = !!ending && ending < Date.now();

  return (
    <div className="tw-text-sm tw-flex tw-items-center tw-gap-x-2 tw-text-iron-300">
      <svg
        className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        aria-hidden="true"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-6.75-6h2.25m-9 2.25h4.5m.002-2.25h.005v.006H12v-.006Zm-.001 4.5h.006v.006h-.006v-.005Zm-2.25.001h.005v.006H9.75v-.006Zm-2.25 0h.005v.005h-.006v-.005Zm6.75-2.247h.005v.005h-.005v-.005Zm0 2.247h.006v.006h-.006v-.006Zm2.25-2.248h.006V15H16.5v-.005Z"
        />
      </svg>
      {!haveEnding ? (
        <span>
          <span className="tw-text-iron-400">Ending in</span> <span>Never</span>
        </span>
      ) : isPast ? (
        <span>
          <span className="tw-text-iron-400">Ending in</span> <span>Ended</span>
        </span>
      ) : (
        <span>
          <span className="tw-text-iron-400">Ending in</span>{" "}
          <span>{getTimeUntil(wave.wave.period?.max!).replace("in ", "")}</span>
        </span>
      )}
    </div>
  );
}
