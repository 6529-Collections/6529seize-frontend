import { MEMES_SEASON } from "../../../../../enums";
import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";
import UserPageStatsTableSection from "./UserPageStatsTableSection";

export interface UserPageStatsTableProps {
  readonly title: string;
  readonly data: UserPageStatsTableItemData[][];
}

export interface UserPageStatsTableItemData {
  readonly title: string;
  readonly isLast: boolean;
  readonly isMain: boolean;
  readonly tooltip: string | null;
  readonly total: string;
  readonly memes: string;
  readonly gradient: string;
  readonly nextgen: string;
  readonly memelab: string;
}

export default function UserPageStatsTable({
  data,
}: {
  readonly data: UserPageStatsTableProps;
}) {
  return (
    <div className="tw-mt-6 lg:tw-mt-8">
      <div className="tw-flex">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          {data.title}
        </h3>
      </div>
      <div className="tw-mt-2 lg:tw-mt-4 tw-bg-iron-950 tw-border tw-border-iron-700 tw-border-solid tw-rounded-lg tw-overflow-x-auto">
        <div className="tw-flow-root">
          <div className="tw-inline-block tw-min-w-full tw-align-middle">
            <table className="tw-min-w-full">
              <thead className="tw-bg-iron-900">
                <tr>
                  <th
                    scope="col"
                    className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400"></th>
                  <th
                    scope="col"
                    className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-right tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
                    Total
                  </th>
                  <th
                    scope="col"
                    className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-right tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
                    Memes
                  </th>
                  <th
                    scope="col"
                    className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-right tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
                    NextGen
                  </th>
                  <th
                    scope="col"
                    className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-right tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
                    Gradient
                  </th>
                  <th
                    scope="col"
                    className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-right tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
                    MemeLab
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.data.flatMap((rows) =>
                  rows.map((row) => (
                    <UserPageStatsTableSection
                      key={getRandomObjectId()}
                      data={row}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
