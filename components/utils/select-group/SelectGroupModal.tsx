import { useEffect, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import SelectGroupModalSearch from "./SelectGroupModalSearch";
import SelectGroupModalHeader from "./SelectGroupModalHeader";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Mutable, NonNullableNotRequired } from "../../../helpers/Types";
import { commonApiFetch } from "../../../services/api/common-api";
import SelectGroupModalItems from "./SelectGroupModalItems";
import { ApiGroupFull } from "../../../generated/models/ApiGroupFull";
import { GroupsRequestParams } from "../../../entities/IGroup";
import { createPortal } from "react-dom";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
export default function SelectGroupModal({
  onClose,
  onGroupSelect,
}: {
  readonly onClose: () => void;
  readonly onGroupSelect: (group: ApiGroupFull) => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  const [filters, setFilters] = useState<GroupsRequestParams>({
    group_name: null,
    author_identity: null,
  });

  const onUserSelect = (value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      author_identity: value,
    }));
  };

  const onFilterNameSearch = (value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      group_name: value,
    }));
  };

  const { data, isFetching } = useQuery<ApiGroupFull[]>({
    queryKey: [QueryKey.GROUPS, filters],
    queryFn: async () => {
      const params: Mutable<NonNullableNotRequired<GroupsRequestParams>> = {};
      if (filters.group_name) {
        params.group_name = filters.group_name;
      }
      if (filters.author_identity) {
        params.author_identity = filters.author_identity;
      }

      return await commonApiFetch<
        ApiGroupFull[],
        NonNullableNotRequired<GroupsRequestParams>
      >({
        endpoint: "groups",
        params,
      });
    },
    placeholderData: keepPreviousData,
  });

  const [groups, setGroups] = useState<ApiGroupFull[]>([]);
  useEffect(() => {
    if (data?.length) {
      setGroups(data);
    } else {
      setGroups([]);
    }
  }, [data]);

  return createPortal(
    <div className="tw-relative tw-z-1000 tailwind-scope">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-text-center sm:tw-items-center tw-p-2 lg:tw-p-0">
          <div
            ref={modalRef}
            className="sm:tw-max-w-md tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500"
          >
            <SelectGroupModalHeader onClose={onClose} />
            <SelectGroupModalSearch
              groupName={filters.group_name}
              groupUser={filters.author_identity}
              onUserSelect={onUserSelect}
              onFilterNameSearch={onFilterNameSearch}
            />
            <div className="tw-h-64 tw-overflow-y-auto tw-mt-4 tw-px-4">
              <SelectGroupModalItems
                groups={groups}
                loading={isFetching}
                onGroupSelect={onGroupSelect}
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
