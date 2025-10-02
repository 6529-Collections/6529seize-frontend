"use client";

import { useEffect, useState } from "react";
import { MEMES_CONTRACT } from "@/constants";
import { distributionPlanApiFetch } from "@/services/distribution-plan-api";

type MemesSeason = `SZN${number}`;

interface MemesSeasonApiResponse {
  readonly season: number;
  readonly tokenIds: string;
}

export default function CreateSnapshotFormSearchCollectionMemesModal({
  collectionName,
  onMemesCollection,
}: {
  collectionName: string;
  onMemesCollection: (param: {
    address: string;
    name: string;
    tokenIds: string | null;
  }) => void;
}) {
  const [options, setOptions] = useState<
    { value: MemesSeason; tokenIds: string }[]
  >([]);

  useEffect(() => {
    const getSeasons = async () => {
      const endpoint = `/other/memes-seasons`;
      const { success, data } = await distributionPlanApiFetch<
        MemesSeasonApiResponse[]
      >(endpoint);
      if (!success || !data) {
        return;
      }
      setOptions(
        data.map((d) => ({
          value: `SZN${d.season}` as MemesSeason,
          tokenIds: d.tokenIds,
        }))
      );
    };
    getSeasons();
  }, []);

  const [selected, setSelected] = useState<MemesSeason[]>(
    options.map((o) => o.value)
  );

  const handleSelect = (szn: MemesSeason) => {
    if (selected.includes(szn)) {
      setSelected((prev) => prev.filter((p) => p !== szn));
      return;
    }
    setSelected((prev) => [...prev, szn]);
  };

  const onDone = () => {
    if (selected.length === options.length || !selected.length) {
      onMemesCollection({
        address: MEMES_CONTRACT.toLowerCase(),
        name: "The Memes by 6529",
        tokenIds: null,
      });
      return;
    }

    const { tokenIds, name } = options
      .filter((option) => selected.includes(option.value))
      .reduce<{ tokenIds: string[]; name: string }>(
        (acc, curr) => {
          acc.tokenIds.push(curr.tokenIds);
          acc.name = `${acc.name} ${curr.value}`;
          return acc;
        },
        { tokenIds: [], name: collectionName }
      );
    onMemesCollection({
      address: MEMES_CONTRACT.toLowerCase(),
      name,
      tokenIds: tokenIds.join(","),
    });
  };

  return (
    <div className="tw-p-8">
      <p className="tw-m-0">Select &quot;The Memes by 6529&quot; Seasons</p>
      <div className="tw-mt-6">
        {!!options.length && (
          <fieldset>
            <legend className="tw-text-base tw-font-semibold tw-leading-6 tw-text-white">
              Seasons
            </legend>
            <div className="tw-mt-4 tw-divide-y tw-divide-solid tw-divide-neutral-800 tw-divide-x-0 tw-border-solid tw-border-x-0 tw-border-b tw-border-t tw-border-neutral-800">
              {options.map((option) => (
                <div
                  onClick={() => handleSelect(option.value)}
                  key={option.value}
                  className="tw-cursor-pointer tw-relative tw-flex tw-items-start tw-py-4">
                  <div className="tw-min-w-0 tw-flex-1 tw-text-sm tw-leading-6 tw-font-medium tw-text-white">
                    {option.value} ({option.tokenIds})
                  </div>
                  <div className="tw-ml-3 tw-flex tw-h-6 tw-w-auto tw-items-center">
                    <input
                      id={`option-${option.value}`}
                      name={`person-${option.value}`}
                      type="checkbox"
                      checked={selected.includes(option.value)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelect(option.value);
                      }}
                      className="tw-cursor-pointer tw-form-checkbox tw-h-4 tw-w-4 tw-bg-neutral-800 tw-rounded tw-border-solid tw-border-gray-600 tw-text-primary-500 focus:tw-ring-primary-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        )}
        {!options.length && (
          <div className="tw-mt-16 tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
            <svg
              aria-hidden="true"
              role="status"
              className="tw-inline tw-w-5 tw-h-5 tw-text-primary-400 tw-animate-spin tw-absolute"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                className="tw-text-neutral-600"
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"></path>
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentColor"></path>
            </svg>
          </div>
        )}
      </div>
      <div className="tw-mt-8 tw-flex tw-justify-end">
        <button
          type="button"
          onClick={onDone}
          className="tw-relative tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out">
          Select
        </button>
      </div>
    </div>
  );
}
