import { useState } from "react";
import { MEMES_CONTRACT } from "../../../../constants";

enum MemesSeason {
  SZN1 = "SZN1",
  SZN2 = "SZN2",
  SZN3 = "SZN3",
  SZN4 = "SZN4",
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
  const options = [
    {
      value: MemesSeason.SZN1,
      tokenIds: "1-47",
    },
    {
      value: MemesSeason.SZN2,
      tokenIds: "48-86",
    },
    {
      value: MemesSeason.SZN3,
      tokenIds: "87-118",
    },
    {
      value: MemesSeason.SZN4,
      tokenIds: "119-125",
    },
  ];

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
    <div className="tw-px-8">
      <div className="tw-mt-6">
        <fieldset>
          <legend className="tw-text-base tw-font-semibold tw-leading-6 tw-text-white">
            Seasons
          </legend>
          <div className="tw-mt-4 tw-divide-y tw-divide-solid tw-divide-neutral-800 tw-divide-x-0 tw-border-solid tw-border-x-0 tw-border-b tw-border-t tw-border-neutral-800">
            {options.map((option) => (
              <div
                onClick={() => handleSelect(option.value)}
                key={option.value}
                className="tw-cursor-pointer tw-relative tw-flex tw-items-start tw-py-4"
              >
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
      </div>
      <div className="tw-mt-8 tw-flex tw-justify-end">
        <button
          type="button"
          onClick={onDone}
          className="tw-relative tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          Select
        </button>
      </div>
    </div>
  );
}
