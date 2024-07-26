import { useQuery } from "@tanstack/react-query";
import { Drop } from "../../../../generated/models/Drop";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import DropsListItem from "../../../drops/view/item/DropsListItem";

export default function WaveSingleDrop({
  dropId,
  availableCredit,
  onBackToList,
}: {
  readonly dropId: string;
  readonly availableCredit: number | null;
  readonly onBackToList: () => void;
}) {
  const { data: drop } = useQuery<Drop>({
    queryKey: [QueryKey.DROP, { drop_id: dropId }],
    queryFn: async () =>
      await commonApiFetch<Drop>({
        endpoint: `drops/${dropId}`,
      }),
  });

  if (!drop) {
    return null;
  }
  return (
    <div className="tw-space-y-2">
      <button
        onClick={onBackToList}
        className="-tw-mt-2 tw-py-2 tw-px-2 -tw-ml-2 tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-50"
      >
        <svg
          className="tw-flex-shrink-0 tw-w-5 tw-h-5"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 12H4M4 12L10 18M4 12L10 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
        <span>Back</span>
      </button>
      <DropsListItem
        drop={drop}
        showWaveInfo={true}
        availableCredit={availableCredit}
      />
    </div>
  );
}
