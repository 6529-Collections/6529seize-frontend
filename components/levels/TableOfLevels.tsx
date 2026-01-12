import levels from "@/constants/levels.json";

interface LevelData {
  level: number;
  threshold: number;
}

export default function TableOfLevels() {
  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-items-center tw-justify-center">
      <div className="tw-w-full tw-overflow-x-auto tw-rounded-lg tw-ring-1 tw-ring-white/[0.15] xl:tw-max-w-4xl">
        <table
          className="tw-min-w-full tw-divide-y tw-divide-iron-700/60"
          aria-labelledby="levels-caption"
        >
          <caption id="levels-caption" className="tw-sr-only">
            Thresholds by Level
          </caption>
          <thead className="tw-sticky tw-top-0 tw-z-10 tw-bg-iron-700">
            <tr>
              <td className="uppercase tw-py-3 tw-pl-4 tw-pr-3 tw-text-left tw-text-xs tw-font-semibold tw-text-white sm:tw-pl-6">
                Level
              </td>
              <td className="uppercase tw-py-3 tw-pl-4 tw-pr-3 tw-text-left tw-text-xs tw-font-semibold tw-text-white sm:tw-pl-6">
                TDH + Rep
              </td>
            </tr>
          </thead>
          <tbody className="tw-divide-y tw-divide-iron-700/60 tw-bg-[#222222]">
            {(levels as LevelData[]).map((level) => (
              <tr
                key={`level-${level.level}`}
                className="tw-transition tw-duration-300 tw-ease-out odd:tw-bg-iron-800/40 hover:tw-bg-iron-700/40"
              >
                <td className="tw-whitespace-nowrap tw-py-3 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-iron-300 sm:tw-pl-6">
                  {level.level}
                </td>
                <td className="tw-whitespace-nowrap tw-py-3 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-iron-300 sm:tw-pl-6">
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
