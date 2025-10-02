import levels from "@/levels.json";

interface LevelData {
  level: number;
  threshold: number;
}

export default function TableOfLevels() {
  return (
    <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-justify-center">
      <div className="tw-w-full xl:tw-max-w-4xl tw-overflow-x-auto tw-ring-1 tw-ring-white/[0.15] tw-rounded-lg">
        <table
          className="tw-min-w-full tw-divide-y tw-divide-neutral-700/60"
          aria-labelledby="levels-caption">
          <caption id="levels-caption" className="tw-sr-only">
            Thresholds by Level
          </caption>
          <thead className="tw-bg-neutral-700 tw-sticky tw-top-0 tw-z-10">
            <tr>
              <td className="tw-py-3 tw-pl-4 tw-pr-3 tw-text-left tw-text-xs tw-font-semibold tw-text-white uppercase sm:tw-pl-6">
                Level
              </td>
              <td className="tw-py-3 tw-pl-4 tw-pr-3 tw-text-left tw-text-xs tw-font-semibold tw-text-white uppercase sm:tw-pl-6">
                TDH + Rep
              </td>
            </tr>
          </thead>
          <tbody className="tw-bg-[#222222] tw-divide-y tw-divide-neutral-700/60">
            {(levels as LevelData[]).map((level, idx) => (
              <tr
                key={`level-${level.level}`}
                className="odd:tw-bg-neutral-800/40 hover:tw-bg-neutral-700/40 tw-transition tw-duration-300 tw-ease-out">
                <td className="tw-whitespace-nowrap sm:tw-pl-6 tw-pr-3 tw-pl-4 tw-py-3 tw-text-sm tw-font-medium tw-text-neutral-300">
                  {level.level}
                </td>
                <td className="tw-whitespace-nowrap tw-py-3 tw-pl-4 tw-pr-3 sm:tw-pl-6 tw-text-sm tw-font-medium tw-text-neutral-300">
                  {level.threshold.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
