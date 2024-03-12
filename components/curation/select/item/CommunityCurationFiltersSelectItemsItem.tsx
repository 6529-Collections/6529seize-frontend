import { use, useContext, useEffect, useState } from "react";
import { CurationFilterResponse } from "../../../../helpers/filters/Filters.types";
import { AuthContext } from "../../../auth/Auth";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveCurationFilterId,
  setActiveCurationFilterId,
} from "../../../../store/curationFilterSlice";
import {
  ImageScale,
  getScaledImageUri,
} from "../../../../helpers/image.helpers";
import Link from "next/link";
import UserLevel from "../../../user/utils/level/UserLevel";
import { formatNumberWithCommasOrDash } from "../../../../helpers/Helpers";
import CommunityCurationFiltersSelectItemsItemFilters from "./CommunityCurationFiltersSelectItemsItemFilters";
import CommunityCurationFiltersSelectItemsItemDelete from "./CommunityCurationFiltersSelectItemsItemDelete";

export default function CommunityCurationFiltersSelectItemsItem({
  filter,
  onEditClick,
}: {
  readonly filter: CurationFilterResponse;
  readonly onEditClick: (filter: CurationFilterResponse) => void;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const activeCurationFilterId = useSelector(selectActiveCurationFilterId);
  const dispatch = useDispatch();

  const [isActive, setIsActive] = useState(
    activeCurationFilterId && activeCurationFilterId === filter.id
  );
  useEffect(() => {
    setIsActive(
      activeCurationFilterId &&
        activeCurationFilterId.toLocaleLowerCase() === filter.id.toLowerCase()
    );
  }, [activeCurationFilterId]);

  const onFilterClick = () => {
    if (isActive) {
      dispatch(setActiveCurationFilterId(null));
    } else {
      dispatch(setActiveCurationFilterId(filter.id));
    }
  };

  const [showFilters, setShowFilters] = useState(false);

  const [isMyFilter, setIsMyFilter] = useState(
    connectedProfile?.profile?.handle.toLowerCase() ===
      filter.created_by?.handle.toLowerCase()
  );

  useEffect(
    () =>
      setIsMyFilter(
        connectedProfile?.profile?.handle.toLowerCase() ===
          filter.created_by?.handle.toLowerCase()
      ),
    [connectedProfile]
  );

  const getEditTitle = () => (isMyFilter ? "Edit" : "Clone");

  const [editTitle, setEditTitle] = useState<string>(getEditTitle());

  useEffect(() => setEditTitle(getEditTitle()), [isMyFilter]);

  return (
    <div
      className={`tw-bg-neutral-700 tw-rounded-lg tw-w-full tw-text-left tw-p-4 ${
        isActive ? "tw-border-2 tw-border-solid tw-border-blue-500" : ""
      }`}
    >
      <button
        onClick={onFilterClick}
        className="tw-bg-transparent tw-border-none tw-text-left tw-w-full"
      >
        {!filter.visible && (
          <div className="tw-text-xs tw-text-right tw-text-red">Not saved</div>
        )}
        <div className="tw-w-full tw-inline-flex tw-justify-between">
          <div className="tw-flex tw-gap-x-4 tw-items-center">
            <div className="tw-h-8 tw-w-8 tw-rounded-md tw-overflow-hidden tw-ring-1 tw-ring-white/10 tw-bg-iron-900">
              <div className="tw-h-full tw-w-full tw-max-w-full">
                <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center">
                  {filter.created_by?.pfp && (
                    <img
                      src={getScaledImageUri(
                        filter.created_by.pfp,
                        ImageScale.W_AUTO_H_50
                      )}
                      alt="Community Table Profile Picture"
                      className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
                    />
                  )}
                </div>
              </div>
            </div>
            <div>
              <div className="tw-truncate tw-max-w-[12rem] sm:tw-max-w-xs tw-text-iron-50 tw-space-x-2">
                <Link
                  href={`/${filter.created_by?.handle}`}
                  className="tw-no-underline hover:tw-underline group-hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out tw-text-iron-50"
                >
                  {filter.created_by?.handle}
                </Link>
                <UserLevel level={filter.created_by?.level ?? 0} size="xs" />
              </div>
              <div className="tw-inline-flex tw-text-xs tw-space-x-2 tw-whitespace-nowrap">
                <div>
                  TDH:{" "}
                  {formatNumberWithCommasOrDash(filter.created_by?.tdh ?? 0)}
                </div>
                <div>
                  CIC:{" "}
                  {formatNumberWithCommasOrDash(filter.created_by?.cic ?? 0)}
                </div>
                <div>
                  Rep:{" "}
                  {formatNumberWithCommasOrDash(filter.created_by?.rep ?? 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
      <div>Curation: {filter.name}</div>
      <div className="tw-w-full tw-inline-flex tw-justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="tw-text-xs tw-bg-blue-500"
        >
          Show filters
        </button>
        <div className="tw-space-x-2">
          {connectedProfile && (
            <button
              onClick={() => onEditClick(filter)}
              className="tw-text-xs tw-bg-blue-500"
            >
              {editTitle}
            </button>
          )}
          {isMyFilter && (
            <CommunityCurationFiltersSelectItemsItemDelete
              filterId={filter.id}
            />
          )}
        </div>
      </div>
      <CommunityCurationFiltersSelectItemsItemFilters
        showFilters={showFilters}
        filters={filter.criteria}
      />
    </div>
  );
}
