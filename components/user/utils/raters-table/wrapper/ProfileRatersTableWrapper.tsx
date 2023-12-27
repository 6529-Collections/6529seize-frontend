import React from "react";
import ProfileRatersTable from "../ProfileRatersTable";
import ProfileRatersTableWrapperHeader from "./ProfileRatersTableWrapperHeader";
import CommonTablePagination from "../../../../utils/CommonTablePagination";

export enum ProfileRatersTableType {
  CIC_RECEIVED = "CIC_RECEIVED",
  REP_RECEIVED = "REP_RECEIVED",
  REP_GIVEN = "REP_GIVEN",
}

export interface IProfileRatersTableItem {
  readonly raterHandle: string;
  readonly rating: number;
  readonly raterCIC: number;
  readonly raterLevel: number;
  readonly lastModified: Date;
}

export default function ProfileRatersTableWrapper({
  type,
  ratings,
  noRatingsMessage,
  currentPage,
  totalPages,
  setCurrentPage,
}: {
  readonly type: ProfileRatersTableType;
  readonly ratings: IProfileRatersTableItem[];
  readonly noRatingsMessage: string;
  readonly currentPage: number;
  readonly totalPages: number;
  readonly setCurrentPage: (currentPage: number) => void;
}) {
  return (
    <div className="tw-bg-iron-900 tw-border tw-border-white/5 tw-border-solid tw-rounded-xl">
      <ProfileRatersTableWrapperHeader type={type} />
      <div className="tw-min-h-[28rem] tw-max-h-[28rem] tw-transform-gpu tw-scroll-py-3 tw-overflow-y-auto">
        {ratings.length ? (
          <div className="tw-flow-root">
            <ProfileRatersTable ratings={ratings} type={type} />
            {totalPages > 1 && (
              <CommonTablePagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
                small={true}
              />
            )}
          </div>
        ) : (
          <div className="tw-mt-4">
            <span className="tw-px-6 md:tw-px-8 tw-text-sm tw-italic tw-text-iron-500">
              {noRatingsMessage}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
