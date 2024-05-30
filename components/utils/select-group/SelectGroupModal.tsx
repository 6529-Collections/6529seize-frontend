import { useEffect, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import SelectGroupModalSearch from "./SelectGroupModalSearch";
import SelectGroupModalHeader from "./SelectGroupModalHeader";
import { CurationFilterRequestParams } from "../../../helpers/groups/groups.helpers";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CurationFilterResponse } from "../../../helpers/filters/Filters.types";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { Mutable, NonNullableNotRequired } from "../../../helpers/Types";
import { commonApiFetch } from "../../../services/api/common-api";
import SelectGroupModalItems from "./SelectGroupModalItems";

export default function SelectGroupModal({
  onClose,
  onGroupSelect,
}: {
  readonly onClose: () => void;
  readonly onGroupSelect: (group: CurationFilterResponse) => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  const [filters, setFilters] = useState<CurationFilterRequestParams>({
    curation_criteria_name: null,
    curation_criteria_user: null,
  });

  const onUserSelect = (value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      curation_criteria_user: value,
    }));
  };

  const onFilterNameSearch = (value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      curation_criteria_name: value,
    }));
  };

  const { data } = useQuery<CurationFilterResponse[]>({
    queryKey: [QueryKey.CURATION_FILTERS, filters],
    queryFn: async () => {
      const params: Mutable<
        NonNullableNotRequired<CurationFilterRequestParams>
      > = {};
      if (filters.curation_criteria_name) {
        params.curation_criteria_name = filters.curation_criteria_name;
      }
      if (filters.curation_criteria_user) {
        params.curation_criteria_user = filters.curation_criteria_user;
      }

      return await commonApiFetch<
        CurationFilterResponse[],
        NonNullableNotRequired<CurationFilterRequestParams>
      >({
        endpoint: "community-members-curation",
        params,
      });
    },
    placeholderData: keepPreviousData,
  });

  const [groups, setGroups] = useState<CurationFilterResponse[]>([]);
  useEffect(() => {
    if (data) {
      setGroups(data);
    } else {
      setGroups([]);
    }
  }, [data]);

  return (
    <div className="tw-relative tw-z-10">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-text-center sm:tw-items-center tw-p-2 lg:tw-p-0">
          <div
            ref={modalRef}
            className="sm:tw-max-w-md tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6"
          >
            <SelectGroupModalHeader onClose={onClose} />
            <SelectGroupModalSearch
              groupName={filters.curation_criteria_name}
              groupUser={filters.curation_criteria_user}
              onUserSelect={onUserSelect}
              onFilterNameSearch={onFilterNameSearch}
            />
            <SelectGroupModalItems
              groups={groups}
              onGroupSelect={onGroupSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
