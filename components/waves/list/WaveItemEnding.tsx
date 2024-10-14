import { ApiWave } from "../../../generated/models/ApiWave";
import { getTimeUntil } from "../../../helpers/Helpers";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

export default function WaveItemEnding({ wave }: { readonly wave: ApiWave }) {
  const ending = wave.wave.period?.max;
  const haveEnding = !!ending;
  const isPast = !!ending && ending < Date.now();

  const content = (
    <div className="tw-text-sm tw-flex tw-items-center tw-gap-x-2 tw-text-iron-300">
      <svg
        className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
        />
      </svg>

      {!haveEnding ? (
        <span>
          <span className="tw-text-iron-400 xl:tw-hidden">Ending</span>{" "}
          <span className="tw-font-medium tw-text-iron-50">Never</span>
        </span>
      ) : isPast ? (
        <span>
          <span className="tw-text-iron-400 xl:tw-hidden">Ending</span>{" "}
          <span className="tw-font-medium tw-text-iron-50">Ended</span>
        </span>
      ) : (
        <span>
          <span className="tw-text-iron-400 xl:tw-hidden">Ending in</span>{" "}
          <span className="tw-font-medium tw-text-iron-50">
            {getTimeUntil(wave.wave.period?.max!).replace("in ", "")}
          </span>
        </span>
      )}
    </div>
  );

  return (
    <Tippy content="Ending" className="xl:tw-inline-block tw-hidden">
      {content}
    </Tippy>
  );
}
