"use client";

import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import type { ApiXTdhGrant } from "@/generated/models/ApiXTdhGrant";
import GroupCreateXtdhGrantMatchMode from "./GroupCreateXtdhGrantMatchMode";
import GroupCreateXtdhGrantRow from "./subcomponents/GroupCreateXtdhGrantRow";
import { toShortGrantId } from "./utils";

export default function GroupCreateXtdhGrantSelection({
  errorMessage,
  grant,
  isFetching,
  isLookupFresh,
  lookupGrantId,
  matchMode,
  setMatchMode,
  showLookupError,
  showNonGrantedWarning,
}: {
  readonly errorMessage: string | null | undefined;
  readonly grant: ApiXTdhGrant | null | undefined;
  readonly isFetching: boolean;
  readonly isLookupFresh: boolean;
  readonly lookupGrantId: string | null;
  readonly matchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"];
  readonly setMatchMode: (
    matchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"]
  ) => void;
  readonly showLookupError: boolean;
  readonly showNonGrantedWarning: boolean;
}) {
  return (
    <>
      {isFetching && !!lookupGrantId && (
        <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-font-medium tw-text-iron-400">
          Validating grant...
        </p>
      )}

      {showLookupError && !!lookupGrantId && (
        <div className="tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-red/30 tw-bg-red/10 tw-p-3">
          <p className="tw-mb-0 tw-text-xs tw-font-medium tw-text-red">
            {errorMessage ?? "Unable to resolve grant ID."}
          </p>
          <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-red/90">
            The ID will still be submitted as entered:{" "}
            <span className="tw-font-semibold">
              {toShortGrantId(lookupGrantId)}
            </span>
          </p>
        </div>
      )}

      {isLookupFresh && !!grant && (
        <>
          <GroupCreateXtdhGrantRow
            grant={grant}
            isSelected={true}
            interactive={false}
            className="tw-mt-3"
          />
          <GroupCreateXtdhGrantMatchMode
            grant={grant}
            matchMode={matchMode}
            setMatchMode={setMatchMode}
            className="tw-mt-3"
          />
        </>
      )}

      {showNonGrantedWarning && (
        <div className="tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-amber-300/30 tw-bg-amber-300/10 tw-p-3">
          <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-amber-300">
            Selected grant status is not GRANTED. This filter is still allowed
            and will be submitted.
          </p>
        </div>
      )}
    </>
  );
}
