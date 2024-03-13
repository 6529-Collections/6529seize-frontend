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
      className={` tw-bg-iron-950 tw-rounded-lg tw-w-full tw-text-left tw-border tw-border-solid tw-border-iron-700 tw-divide-y tw-divide-x-0 tw-divide-solid tw-divide-iron-700  ${
        isActive ? "" : ""
      }`}
    >
      <div className="tw-px-4 tw-py-2.5">
        <div className="tw-flex tw-items-center tw-w-full tw-justify-between">
          <p className="tw-text-sm tw-font-medium tw-mb-0">
            <span className="tw-text-iron-400 tw-pr-1">Curation:</span>
            <span className="tw-text-iron-50">{filter.name}</span>
          </p>
          <div className="tw-relative">
            <button
              type="button"
              className="tw-bg-transparent tw-h-full tw-border-0 tw-block tw-text-iron-500 hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out"
              id="options-menu-0-button"
              aria-expanded="false"
              aria-haspopup="true"
            >
              <span className="tw-sr-only">Open options</span>
              <svg
                className="tw-h-5 tw-w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
              </svg>
            </button>
            <div
              className="tw-hidden tw-absolute tw-right-0 tw-z-10 tw-mt-2 tw-w-32 tw-origin-top-right tw-rounded-md tw-bg-iron-900 tw-py-2 tw-shadow-lg tw-ring-1 tw-ring-white/5 tw-focus:tw-outline-none"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="options-menu-0-button"
              tabindex="-1"
            >
              <div
                className="tw-cursor-pointer tw-block tw-px-3 tw-py-1 tw-text-sm tw-leading-6 tw-text-iron-50 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
                role="menuitem"
                tabindex="-1"
                id="options-menu-0-item-0"
              >
                Edit
              </div>
              <div
                className="tw-cursor-pointer tw-block tw-px-3 tw-py-1 tw-text-sm tw-leading-6 tw-text-iron-50 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
                role="menuitem"
                tabindex="-1"
                id="options-menu-0-item-1"
              >
                Delete
              </div>
            </div>
          </div>
        </div>
        <div className="tw-mt-2 tw-w-full tw-inline-flex tw-gap-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="tw-relative tw-text-xs tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-iron-200 tw-focus:tw-outline-none tw-focus:tw-ring-1 tw-focus:tw-ring-inset tw-focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-800 hover:tw-bg-iron-800 tw-focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
          >
            <span>Show filters</span>
            <svg
              className="tw-flex-shrink-0 tw-h-4 tw-w-4 -tw-mr-1.5 tw-ml-1"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <div className="tw-space-x-3 tw-hidden">
            {connectedProfile && (
              <button
                onClick={() => onEditClick(filter)}
                className="tw-relative tw-text-xs tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-iron-200 tw-focus:tw-outline-none tw-focus:tw-ring-1 tw-focus:tw-ring-inset tw-focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-800 hover:tw-bg-iron-800 tw-focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
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
      <button
        onClick={onFilterClick}
        className="tw-bg-transparent tw-px-4 tw-py-2 tw-border-none tw-text-left tw-w-full"
      >
        {!filter.visible && (
          <div className="tw-text-xs tw-text-right tw-text-red">Not saved</div>
        )}
        <div className="tw-w-full tw-inline-flex tw-gap-x-2 tw-items-center">
          <p className="tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-400 tw-mb-0">
            Created by
          </p>
          <div className="tw-flex tw-gap-x-2 tw-items-center">
            <div className="tw-h-6 tw-w-6 tw-rounded-md tw-overflow-hidden tw-ring-1 tw-ring-white/10 tw-bg-iron-900">
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
            <div className="tw-flex tw-items-center tw-space-x-2">
              <Link
                href={`/${filter.created_by?.handle}`}
                className="tw-no-underline hover:tw-underline tw-group-hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out tw-text-iron-50 tw-text-sm tw-font-semibold"
              >
                {filter.created_by?.handle}
              </Link>
              <UserLevel level={filter.created_by?.level ?? 0} size="xs" />
            </div>
            <div className="tw-hidden tw-inline-flex tw-text-xs tw-space-x-2 tw-whitespace-nowrap">
              <div>
                TDH: {formatNumberWithCommasOrDash(filter.created_by?.tdh ?? 0)}
              </div>
              <div>
                CIC: {formatNumberWithCommasOrDash(filter.created_by?.cic ?? 0)}
              </div>
              <div>
                Rep: {formatNumberWithCommasOrDash(filter.created_by?.rep ?? 0)}
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
