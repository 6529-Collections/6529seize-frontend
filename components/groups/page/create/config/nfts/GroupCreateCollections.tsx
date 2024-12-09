import { ApiCreateGroupDescription } from "../../../../../../generated/models/ApiCreateGroupDescription";
import { ApiGroupOwnsNft, ApiGroupOwnsNftNameEnum } from "../../../../../../generated/models/ApiGroupOwnsNft";

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
      };
      const filteredNfts = nfts.filter((n) => n.name !== collection);
      setNfts([...filteredNfts, newCollection]);
    }
  };

  return (
    <div className="tw-p-3 sm:tw-p-5 tw-bg-iron-950 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
      <div>
        <p className="tw-mb-0 tw-text-base sm:tw-text-lg tw-font-semibold tw-text-iron-50">
          Collection Access
        </p>
        <p className="tw-mb-0 tw-mt-0.5 tw-text-sm tw-text-iron-400">
          Identity must own any token from these collections.
        </p>
      </div>
      <div className="tw-mt-2 sm:tw-mt-3">
        <div className="tw-grid tw-grid-cols-2 tw-gap-2">
          {COLLECTIONS.map((collection) => {
            const existingCollection = nfts.find((n) => n.name === collection.enum);
            const isSelected = existingCollection?.tokens.length === 0;
            return (
              <button
                key={collection.enum}
                onClick={() => toggleCollection(collection.enum)}
                className={`tw-p-3 tw-rounded-xl tw-border tw-border-solid tw-transition-colors ${
                  isSelected
                    ? "tw-bg-iron-800 tw-border-iron-700 tw-text-iron-50"
                    : "tw-bg-iron-950 tw-border-iron-800 tw-text-iron-400 hover:tw-border-iron-700 hover:tw-text-iron-50"
                }`}
              >
                <span className="tw-text-base tw-font-medium">{collection.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
