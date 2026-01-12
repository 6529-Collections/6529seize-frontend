import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants/constants";
import { ApiGroupOwnsNftNameEnum } from "@/generated/models/ApiGroupOwnsNft";
import type { ApiNftsPage } from "@/generated/models/ApiNftsPage";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";

export default function GroupCreateNftsSelectedItem({
  nft,
  onRemove,
}: {
  readonly nft: {
    readonly name: ApiGroupOwnsNftNameEnum;
    readonly token: string;
  };
  readonly onRemove: () => void;
}) {
  const NAME_TO_CONTRACT_MAP: Record<ApiGroupOwnsNftNameEnum, string> = {
    [ApiGroupOwnsNftNameEnum.Gradients]: GRADIENT_CONTRACT,
    [ApiGroupOwnsNftNameEnum.Memelab]: MEMELAB_CONTRACT,
    [ApiGroupOwnsNftNameEnum.Nextgen]: NEXTGEN_CONTRACT,
    [ApiGroupOwnsNftNameEnum.Memes]: MEMES_CONTRACT,
  };

  const NAME_TO_NAME_MAP: Record<ApiGroupOwnsNftNameEnum, string> = {
    [ApiGroupOwnsNftNameEnum.Gradients]: "Gradients",
    [ApiGroupOwnsNftNameEnum.Memelab]: "Memelab",
    [ApiGroupOwnsNftNameEnum.Nextgen]: "NextGen",
    [ApiGroupOwnsNftNameEnum.Memes]: "The Memes",
  };

  const { data } = useQuery({
    queryKey: [
      QueryKey.NFTS,
      {
        contract: NAME_TO_CONTRACT_MAP[nft.name],
        id: nft.token,
      },
    ],
    queryFn: async () => {
      return await commonApiFetch<ApiNftsPage>({
        endpoint: "nfts",
        params: {
          contract: NAME_TO_CONTRACT_MAP[nft.name],
          id: nft.token,
        },
      });
    },
  });
  return (
    <div className="tw-flex tw-items-center tw-gap-x-3 tw-rounded-lg tw-bg-iron-950 tw-px-2 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-ring-iron-700">
      <div className="tw-flex tw-items-center tw-gap-x-2 tw-py-1">
        <div className="tw-relative tw-h-7 tw-w-7 tw-flex-shrink-0 tw-rounded-sm tw-border tw-border-solid tw-border-white/10 tw-bg-iron-800">
          <div className="tw-h-full tw-w-full tw-max-w-full tw-overflow-hidden tw-rounded-sm tw-bg-iron-800">
            <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-sm tw-text-center">
              {data?.data?.[0]?.image ? (
                <img
                  src={getScaledImageUri(
                    data.data[0].image,
                    ImageScale.W_AUTO_H_50
                  )}
                  alt={data.data[0].name}
                  className="tw-h-full tw-w-full tw-object-contain"
                />
              ) : (
                <div className="tw-h-full tw-w-full tw-bg-iron-900"></div>
              )}
            </div>
          </div>
        </div>
        <span className="tw-text-xs tw-font-semibold tw-text-iron-50">
          {data?.data?.[0]?.name}
        </span>
        <span className="tw-h-1 tw-w-1 tw-rounded-full tw-bg-iron-600"></span>
        <span className="text-xs tw-font-medium tw-text-iron-300">
          {NAME_TO_NAME_MAP[nft.name]}
        </span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="tw-group tw-relative -tw-mr-1.5 tw-flex tw-h-full tw-items-center tw-justify-center tw-border-y-0 tw-border-l tw-border-r-0 tw-border-solid tw-border-iron-700 tw-bg-transparent tw-text-iron-400 tw-transition-all tw-duration-300 tw-ease-out hover:tw-text-error"
      >
        <span className="tw-sr-only">Remove</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="tw-size-4 tw-flex-shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
