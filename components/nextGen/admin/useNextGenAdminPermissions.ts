import {
  isCollectionAdmin,
  isCollectionArtist,
  useCollectionAdmin,
  useCollectionArtist,
  useCollectionIndex,
  useFunctionAdmin,
  useGlobalAdmin,
  useParsedCollectionIndex,
} from "../nextgen_helpers";
import { FunctionSelectors } from "../nextgen_contracts";

export function useNextGenAdminPermissions(address: string) {
  const globalAdmin = useGlobalAdmin(address);
  const createCollectionFunctionAdmin = useFunctionAdmin(
    address,
    FunctionSelectors.CREATE_COLLECTION
  );
  const airdropTokensFunctionAdmin = useFunctionAdmin(
    address,
    FunctionSelectors.AIRDROP_TOKENS
  );
  const setDataFunctionAdmin = useFunctionAdmin(
    address,
    FunctionSelectors.SET_COLLECTION_DATA
  );
  const setCostsFunctionAdmin = useFunctionAdmin(
    address,
    FunctionSelectors.SET_COLLECTION_COSTS
  );
  const setPhasesFunctionAdmin = useFunctionAdmin(
    address,
    FunctionSelectors.SET_COLLECTION_PHASES
  );
  const updateInfoFunctionAdmin = useFunctionAdmin(
    address,
    FunctionSelectors.UPDATE_COLLECTION_INFO
  );
  const changeMetadataViewFunctionAdmin = useFunctionAdmin(
    address,
    FunctionSelectors.CHANGE_METADATA_VIEW
  );
  const setFinalSupplyFunctionAdmin = useFunctionAdmin(
    address,
    FunctionSelectors.SET_FINAL_SUPPLY
  );
  const initializeBurnFunctionAdmin = useFunctionAdmin(
    address,
    FunctionSelectors.INITIALIZE_BURN
  );
  const updateImagesAttributesFunctionAdmin = useFunctionAdmin(
    address,
    FunctionSelectors.UPDATE_IMAGES_AND_ATTRIBUTES
  );
  const addRandomizerFunctionAdmin = useFunctionAdmin(
    address,
    FunctionSelectors.ADD_RANDOMIZER
  );
  const setSplitsFunctionAdmin = useFunctionAdmin(
    address,
    FunctionSelectors.SET_PRIMARY_AND_SECONDARY_SPLITS
  );
  const proposePrimaryAddressesAndPercentagesFunctionAdmin = useFunctionAdmin(
    address,
    FunctionSelectors.PROPOSE_PRIMARY_ADDRESSES_AND_PERCENTAGES
  );
  const proposeSecondaryAddressesAndPercentagesFunctionAdmin = useFunctionAdmin(
    address,
    FunctionSelectors.PROPOSE_SECONDARY_ADDRESSES_AND_PERCENTAGES
  );
  const acceptAddressesAndPercentagesFunctionAdmin = useFunctionAdmin(
    address,
    FunctionSelectors.ACCEPT_ADDRESSES_AND_PERCENTAGES
  );
  const payArtistFunctionAdmin = useFunctionAdmin(
    address,
    FunctionSelectors.PAY_ARTIST
  );
  const mintAndAuctionFunctionAdmin = useFunctionAdmin(
    address,
    FunctionSelectors.MINT_AND_AUCTION
  );
  const initializeExternalBurnSwapFunctionAdmin = useFunctionAdmin(
    address,
    FunctionSelectors.INITIALIZE_EXTERNAL_BURN_SWAP
  );
  const collectionIndex = useCollectionIndex();
  const parsedCollectionIndex = useParsedCollectionIndex(collectionIndex);

  const collectionAdmin = useCollectionAdmin(address, parsedCollectionIndex);

  const isWalletCollectionAdmin = isCollectionAdmin(collectionAdmin);

  const collectionArtists = useCollectionArtist(parsedCollectionIndex);

  const isArtist = isCollectionArtist(address, collectionArtists);

  return {
    globalAdmin,
    createCollectionFunctionAdmin,
    airdropTokensFunctionAdmin,
    setDataFunctionAdmin,
    setCostsFunctionAdmin,
    setPhasesFunctionAdmin,
    updateInfoFunctionAdmin,
    changeMetadataViewFunctionAdmin,
    setFinalSupplyFunctionAdmin,
    initializeBurnFunctionAdmin,
    updateImagesAttributesFunctionAdmin,
    addRandomizerFunctionAdmin,
    setSplitsFunctionAdmin,
    proposePrimaryAddressesAndPercentagesFunctionAdmin,
    proposeSecondaryAddressesAndPercentagesFunctionAdmin,
    acceptAddressesAndPercentagesFunctionAdmin,
    payArtistFunctionAdmin,
    mintAndAuctionFunctionAdmin,
    initializeExternalBurnSwapFunctionAdmin,
    isWalletCollectionAdmin,
    isArtist,
  };
}
