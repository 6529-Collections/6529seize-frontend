"use client";

import { DistributionPlanSearchContractMetadataResult } from "@/components/allowlist-tool/allowlist-tool.types";
import DistributionPlanVerifiedIcon from "@/components/distribution-plan-tool/common/DistributionPlanVerifiedIcon";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import {
    formatNumber,
    truncateTextMiddle,
} from "@/helpers/AllowlistToolHelpers";
import { distributionPlanApiFetch } from "@/services/distribution-plan-api";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { useContext } from "react";

interface CollectionMeta {
  readonly imgUrl: string;
  readonly openseaVerified: boolean;
  readonly name: string;
  readonly tokenType: string;
  readonly allTimeVolume: string;
  readonly floorPrice: string;
}

interface CollectionSelectionParams {
  readonly address: string;
  readonly name: string;
  readonly tokenIds: string | null;
}

interface CreateSnapshotFormSearchCollectionDropdownItemProps {
  readonly collection: DistributionPlanSearchContractMetadataResult;
  readonly onCollection: (param: CollectionSelectionParams) => void;
}

export default function CreateSnapshotFormSearchCollectionDropdownItem({
  collection,
  onCollection,
}: CreateSnapshotFormSearchCollectionDropdownItemProps) {
  const { setToasts } = useContext(DistributionPlanToolContext);
  const collectionMeta: CollectionMeta = {
    imgUrl: collection.imageUrl ?? "",
    openseaVerified: collection.openseaVerified,
    name: truncateTextMiddle(collection.name, 20),
    tokenType: collection.tokenType,
    allTimeVolume:
      typeof collection.allTimeVolume === "number"
        ? formatNumber(collection.allTimeVolume)
        : "N/A",
    floorPrice:
      typeof collection.floorPrice === "number"
        ? formatNumber(collection.floorPrice)
        : "N/A",
  };

  const fetchTokenIdsMutation = useMutation<string | null, Error, string>({
    mutationFn: async (collectionId) => {
      const endpoint = `/other/contract-token-ids-as-string/${collectionId}`;
      const { success, data } = await distributionPlanApiFetch<{
        readonly tokenIds: string;
      }>(endpoint);
      if (!success) {
        throw new Error("Failed to fetch token IDs");
      }
      return data?.tokenIds?.length ? data.tokenIds : null;
    },
  });

  const onCollectionClick = async () => {
    const regex = /^0x[0-9a-fA-F]{40}:.+$/;
    const isSubCollection = regex.test(collection.id);
    if (isSubCollection) {
      try {
        const tokenIdsString = await fetchTokenIdsMutation.mutateAsync(
          collection.id
        );
        onCollection({
          name: collection.name,
          address: collection.address,
          tokenIds: tokenIdsString,
        });
      } catch (error) {
        // distributionPlanApiFetch already surfaces toast notifications on failure
        return;
      }
      return;
    }
    onCollection({
      name: collection.name,
      address: collection.address,
      tokenIds: null,
    });
  };

  return (
    <tr
      className="tw-cursor-pointer hover:tw-bg-iron-700 tw-duration-300 tw-ease-out"
      onClick={onCollectionClick}
    >
      <td className="tw-whitespace-nowrap tw-py-2.5 tw-pl-4 tw-pr-3">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <Image
            unoptimized
            src={collectionMeta.imgUrl}
            alt=""
            width={16}
            height={16}
            className="tw-bg-iron-700 tw-rounded"
          />

          <span className="tw-text-sm tw-font-medium tw-text-iron-200">
            {collectionMeta.name}
          </span>
          {collectionMeta.openseaVerified && <DistributionPlanVerifiedIcon />}
          <span className="tw-uppercase tw-text-xs tw-text-iron-500 tw-mt-0.5">
            {collectionMeta.tokenType}
          </span>
        </div>
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-2.5 tw-text-right tw-text-sm tw-font-medium tw-text-iron-200">
        <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-1.5">
          <span>{collectionMeta.allTimeVolume}</span>
          <svg
            className="tw-h-4 tw-w-auto"
            viewBox="0 0 1080 1760"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              opacity="0.6"
              d="M539.8 650.9L0 896.3L539.8 1215.4L1079.7 896.3L539.8 650.9Z"
              fill="#B6B6B6"
            />
            <path
              opacity="0.45"
              d="M0.199951 896.3L540 1215.4V650.9V0.600098L0.199951 896.3Z"
              fill="#B6B6B6"
            />
            <path
              opacity="0.8"
              d="M540 0.600098V650.9V1215.4L1079.8 896.3L540 0.600098Z"
              fill="#B6B6B6"
            />
            <path
              opacity="0.45"
              d="M0 998.7L539.8 1759.4V1317.6L0 998.7Z"
              fill="#B6B6B6"
            />
            <path
              opacity="0.8"
              d="M539.8 1317.6V1759.4L1080 998.7L539.8 1317.6Z"
              fill="#B6B6B6"
            />
          </svg>
        </div>
      </td>
      <td className="tw-whitespace-nowrap tw-pl-2 tw-pr-4 tw-py-2.5 tw-text-right tw-text-sm tw-font-medium  tw-text-iron-200">
        <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-1.5">
          <span>{collectionMeta.floorPrice}</span>
          <svg
            className="tw-h-4 tw-w-auto"
            viewBox="0 0 1080 1760"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              opacity="0.6"
              d="M539.8 650.9L0 896.3L539.8 1215.4L1079.7 896.3L539.8 650.9Z"
              fill="#B6B6B6"
            />
            <path
              opacity="0.45"
              d="M0.199951 896.3L540 1215.4V650.9V0.600098L0.199951 896.3Z"
              fill="#B6B6B6"
            />
            <path
              opacity="0.8"
              d="M540 0.600098V650.9V1215.4L1079.8 896.3L540 0.600098Z"
              fill="#B6B6B6"
            />
            <path
              opacity="0.45"
              d="M0 998.7L539.8 1759.4V1317.6L0 998.7Z"
              fill="#B6B6B6"
            />
            <path
              opacity="0.8"
              d="M539.8 1317.6V1759.4L1080 998.7L539.8 1317.6Z"
              fill="#B6B6B6"
            />
          </svg>
        </div>
      </td>
    </tr>
  );
}
