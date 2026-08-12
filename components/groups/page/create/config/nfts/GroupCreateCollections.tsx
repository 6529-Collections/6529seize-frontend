import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import type { ApiGroupOwnsNft } from "@/generated/models/ApiGroupOwnsNft";
import { ApiGroupOwnsNftNameEnum } from "@/generated/models/ApiGroupOwnsNft";
import { DEFAULT_GROUP_NFT_OWNERSHIP_MATCH_MODE } from "@/helpers/groups/group-nft-ownership";
import { CheckIcon } from "@heroicons/react/24/outline";

const COLLECTIONS = [
  { name: "Gradients", enum: ApiGroupOwnsNftNameEnum.Gradients },
  { name: "Memes", enum: ApiGroupOwnsNftNameEnum.Memes },
  { name: "Memelab", enum: ApiGroupOwnsNftNameEnum.Memelab },
  { name: "Nextgen", enum: ApiGroupOwnsNftNameEnum.Nextgen },
];

export default function GroupCreateCollections({
  nfts,
  setNfts,
}: {
  readonly nfts: ApiCreateGroupDescription["owns_nfts"];
  readonly setNfts: (nfts: ApiCreateGroupDescription["owns_nfts"]) => void;
}) {
  const toggleCollection = (collection: ApiGroupOwnsNftNameEnum) => {
    const existingCollection = nfts.find((n) => n.name === collection);

    if (existingCollection?.tokens.length === 0) {
      setNfts(nfts.filter((n) => n.name !== collection));
    } else {
      const newCollection: ApiGroupOwnsNft = {
        name: collection,
        tokens: [],
        match_mode: DEFAULT_GROUP_NFT_OWNERSHIP_MATCH_MODE,
      };
      const filteredNfts = nfts.filter((n) => n.name !== collection);
      setNfts([...filteredNfts, newCollection]);
    }
  };

  return (
    <div className="tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950 tw-p-3 tw-shadow-inner sm:tw-p-5">
      <div>
        <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-50">
          Collection Access
        </p>
        <p className="tw-mb-0 tw-mt-0.5 tw-text-sm tw-text-iron-500">
          Identity must own any token from these collections.
        </p>
      </div>
      <div className="tw-mt-2 sm:tw-mt-4">
        <div className="tw-grid tw-grid-cols-2 tw-gap-3">
          {COLLECTIONS.map((collection) => {
            const existingCollection = nfts.find(
              (n) => n.name === collection.enum
            );
            const isSelected = existingCollection?.tokens.length === 0;
            return (
              <button
                key={collection.enum}
                type="button"
                onClick={() => toggleCollection(collection.enum)}
                className={`tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2.5 tw-text-left tw-transition-colors ${
                  isSelected
                    ? "tw-border-primary-500/50 tw-bg-primary-500/10 tw-text-primary-400"
                    : "tw-border-white/5 tw-bg-iron-900 tw-text-iron-300 hover:tw-border-white/10 hover:tw-bg-iron-800 hover:tw-text-iron-100"
                }`}
              >
                <span className="tw-min-w-0 tw-truncate tw-text-sm tw-font-medium">
                  {collection.name}
                </span>
                {isSelected && (
                  <CheckIcon
                    aria-hidden="true"
                    className="tw-size-4 tw-flex-shrink-0 tw-text-primary-400"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
