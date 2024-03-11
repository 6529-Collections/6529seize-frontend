import { use, useContext, useEffect, useState } from "react";
import { CurationFilterResponse } from "../../../helpers/filters/Filters.types";
import { AuthContext } from "../../auth/Auth";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveCurationFilterId,
  setActiveCurationFilterId,
} from "../../../store/curationFilterSlice";

export default function CommunityCurationFiltersSelectItemsItem({
  filter,
}: {
  readonly filter: CurationFilterResponse;
}) {
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

  return (
    <li>
      <button
        onClick={onFilterClick}
        className="tw-bg-transparent tw-border-none"
      >
        {filter.name}{" "}
        {isActive && (
          <svg
            className="tw-h-5 tw-w-5 tw-ml-2 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 6L9 17L4 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </li>
  );
}
