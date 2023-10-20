import { Container, Row, Col, Button } from "react-bootstrap";
import { useAccount } from "wagmi";
import { use, useEffect, useState } from "react";
import styles from "./NextGenAdmin.module.scss";
import { useRouter } from "next/router";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  isCollectionAdmin,
  isCollectionArtist,
  useCollectionArtist,
} from "./admin_helpers";
import ConnectWalletButton from "../../delegation/ConnectWalletButton";
import { FunctionSelectors, NEXTGEN_CHAIN_ID } from "../contracts";
import NextGenAdminSetData from "./NextGenAdminSetData";
import NextGenAdminSetCosts from "./NextGenAdminSetCosts";
import NextGenAdminSetPhases from "./NextGenAdminSetPhases";
import NextGenAdminRegisterAdmin, {
  ADMIN_TYPE,
} from "./NextGenAdminRegisterAdmin";
import NextGenAdminSignCollection from "./NextGenAdminSignCollection";
import NextGenAdminAirdropTokens from "./NextGenAdminAirdropTokens";
import NextGenAdminProposeAddressesAndPercentages, {
  ProposalType,
} from "./NextGenAdminProposeAddressesAndPercentages";
import NextGenAdminSetSplits from "./NextGenAdminSetSplits";
import NextGenAdminChangeMetadataView from "./NextGenAdminChangeMetadataView";
import NextGenAdminUpdateImagesAttributes from "./NextGenAdminUpdateImagesAttributes";
import NextGenAdminAddRandomizer from "./NextGenAdminAddRandomizer";
import NextGenAdminSetFinalSupply from "./NextGenAdminSetFinalSupply";
import NextGenAdminInitializeBurn from "./NextGenAdminInitializeBurn";
import NextGenAdminAcceptAddressesAndPercentages from "./NextGenAdminAcceptAddressesAndPercentages";
import NextGenAdminPayArtist from "./NextGenAdminPayArtist";
import NextGenAdminMintAndAuction from "./NextGenAdminMintAndAuction";
import NextGenAdminInitializeExternalBurnSwap from "./NextGenAdminInitializeExternalBurnSwap";
import NextGenAdminUpdateDelegationCollection from "./NextGenAdminUpdateDelegationCollection";
import NextGenAdminCreateCollection from "./NextGenAdminCreateCollection";
import NextGenAdminUpdateCollection, {
  UpdateType,
} from "./NextGenAdminUpdateCollection";

enum Focus {
  GLOBAL = "global",
  COLLECTION = "collection",
  ARTIST = "artist",
}

enum GlobalFocus {
  CREATE_COLLECTION = "create_collection",
  AIRDROP_TOKENS = "airdrop_tokens",
  UPDATE_IMAGES_ATTRIBUTES = "update_images_attributes",
  SET_FINAL_SUPPLY = "set_final_supply",
  ADD_RANDOMIZER = "add_randomizer",
  UPDATE_DELEGATION_COLLECTION = "update_delegation_collection",
  SET_PRIMARY_AND_SECONDARY_SPLITS = "set_primary_and_secondary_splits",
  INITIALIZE_BURN = "initialize_burn",
  PROPOSE_PRIMARY_ADDRESSES_AND_PERCENTAGES = "propose_primary_addresses_and_percentages",
  PROPOSE_SECONDARY_ADDRESSES_AND_PERCENTAGES = "propose_secondary_addresses_and_percentages",
  ACCEPT_ADDRESSES_AND_PERCENTAGES = "accept_addresses_and_percentages",
  PAY_ARTIST = "pay_artist",
  REGISTER_GLOBAL_ADMIN = "register_global_admin",
  REGISTER_FUNCTION_ADMIN = "register_function_admin",
  REGISTER_COLLECTION_ADMIN = "register_collection_admin",
  MINT_AND_AUCTION = "mint_and_auction",
  INITIALIZE_EXTERNAL_BURN_SWAP = "initialize_external_burn_swap",
}

enum CollectionFocus {
  SET_DATA = "set_data",
  SET_COSTS = "set_costs",
  SET_PHASES = "set_phases",
  UPDATE_INFO = "update_info",
  UPDATE_BASE_URI = "update_base_uri",
  UPDATE_SCRIPT_BY_INDEX = "update_script_by_index",
  CHANGE_METADATA_VIEW = "change_metadata_view",
}

enum ArtistFocus {
  SIGN_COLLECTION = "sign_collection",
  PROPOSE_PRIMARY_ADDRESSES_AND_PERCENTAGES = "propose_primary_addresses_and_percentages",
  PROPOSE_SECONDARY_ADDRESSES_AND_PERCENTAGES = "propose_secondary_addresses_and_percentages",
}

export default function NextGenAdmin() {
  const router = useRouter();
  const account = useAccount();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const createCollectionFunctionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.CREATE_COLLECTION
  );
  const airdropTokensFunctionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.AIRDROP_TOKENS
  );
  const setDataFunctionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.SET_COLLECTION_DATA
  );
  const setCostsFunctionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.SET_COLLECTION_COSTS
  );
  const setPhasesFunctionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.SET_COLLECTION_PHASES
  );
  const updateInfoFunctionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.UPDATE_COLLECTION_INFO
  );
  const changeMetadataViewFunctionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.CHANGE_METADATA_VIEW
  );
  const setFinalSupplyFunctionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.SET_FINAL_SUPPLY
  );
  const initializeBurnFunctionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.INITIALIZE_BURN
  );
  const updateImagesAttributesFunctionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.UPDATE_IMAGES_AND_ATTRIBUTES
  );
  const addRandomizerFunctionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.ADD_RANDOMIZER
  );
  const updateDelegationCollectionAdminFunction = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.UPDATE_DELEGATION_COLLECTION
  );
  const setSplitsFunctionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.SET_PRIMARY_AND_SECONDARY_SPLITS
  );
  const proposePrimaryAddressesAndPercentagesFunctionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.PROPOSE_PRIMARY_ADDRESSES_AND_PERCENTAGES
  );
  const proposeSecondaryAddressesAndPercentagesFunctionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.PROPOSE_SECONDARY_ADDRESSES_AND_PERCENTAGES
  );
  const acceptAddressesAndPercentagesFunctionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.ACCEPT_ADDRESSES_AND_PERCENTAGES
  );
  const payArtistFunctionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.PAY_ARTIST
  );
  const mintAndAuctionFunctionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.MINT_AND_AUCTION
  );
  const initializeExternalBurnSwapFunctionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.INITIALIZE_EXTERNAL_BURN_SWAP
  );
  const collectionIndex = useCollectionIndex();
  const collectionAdmin = useCollectionAdmin(
    account.address as string,
    parseInt(collectionIndex.data as string)
  );
  const isWalletCollectionAdmin = isCollectionAdmin(collectionAdmin);

  const collectionArtists = useCollectionArtist(
    parseInt(collectionIndex.data as string)
  );

  const isArtist = isCollectionArtist(
    account.address as string,
    collectionArtists
  );

  const [focus, setFocus] = useState<Focus>(
    (router.query.focus as Focus) || Focus.GLOBAL
  );

  const [globalFocus, setGlobalFocus] = useState<GlobalFocus>();
  const [collectionFocus, setCollectionFocus] = useState<CollectionFocus>();
  const [artistFocus, setArtistFocus] = useState<ArtistFocus>();

  useEffect(() => {
    setGlobalFocus(undefined);
    setCollectionFocus(undefined);
    setArtistFocus(undefined);
    router.push(
      {
        pathname: router.pathname,
        query: `focus=${focus}`,
      },
      undefined,
      { shallow: true }
    );
  }, [focus]);

  function close() {
    setGlobalFocus(undefined);
    setCollectionFocus(undefined);
    setArtistFocus(undefined);
  }

  function printLeftMenu() {
    return (
      <Container className="no-padding">
        <Row className="pt-2 pb-2">
          <Col
            className={
              focus === Focus.GLOBAL ? styles.tabLeftActive : styles.tabLeft
            }
            onClick={() => setFocus(Focus.GLOBAL)}>
            <b>Global</b>
          </Col>
        </Row>
        <Row className="pt-2 pb-2">
          <Col
            className={
              focus === Focus.COLLECTION ? styles.tabLeftActive : styles.tabLeft
            }
            onClick={() => setFocus(Focus.COLLECTION)}>
            <b>Collection</b>
          </Col>
        </Row>
        <Row className="pt-2 pb-2">
          <Col
            className={
              focus === Focus.ARTIST ? styles.tabLeftActive : styles.tabLeft
            }
            onClick={() => setFocus(Focus.ARTIST)}>
            <b>Artist</b>
          </Col>
        </Row>
      </Container>
    );
  }

  function printGlobal() {
    if (
      !isGlobalAdmin() &&
      createCollectionFunctionAdmin.data === false &&
      airdropTokensFunctionAdmin.data === false &&
      setSplitsFunctionAdmin.data === false &&
      updateImagesAttributesFunctionAdmin.data === false &&
      setFinalSupplyFunctionAdmin.data === false &&
      initializeBurnFunctionAdmin.data === false &&
      addRandomizerFunctionAdmin.data === false &&
      updateDelegationCollectionAdminFunction.data === false &&
      proposePrimaryAddressesAndPercentagesFunctionAdmin.data === false &&
      proposeSecondaryAddressesAndPercentagesFunctionAdmin.data === false &&
      acceptAddressesAndPercentagesFunctionAdmin.data === false &&
      payArtistFunctionAdmin.data === false &&
      mintAndAuctionFunctionAdmin.data === false &&
      initializeExternalBurnSwapFunctionAdmin.data === false
    ) {
      return (
        <Container className="no-padding">
          <Row className="pt-2">
            <Col className="d-flex flex-column align-items-center gap-3">
              <h4 className="font-color">
                ONLY ADMIN WALLETS CAN USE THIS dAPP.
              </h4>
              <h4 className="font-color">
                PLEASE USE AN ADMIN WALLET TO CONTINUE.
              </h4>
            </Col>
          </Row>
        </Container>
      );
    }

    return (
      <Container>
        {(isGlobalAdmin() ||
          createCollectionFunctionAdmin.data === true ||
          airdropTokensFunctionAdmin.data === true ||
          updateImagesAttributesFunctionAdmin.data === true ||
          setFinalSupplyFunctionAdmin.data === true ||
          initializeBurnFunctionAdmin.data === true ||
          mintAndAuctionFunctionAdmin.data === true ||
          initializeExternalBurnSwapFunctionAdmin.data === true ||
          updateDelegationCollectionAdminFunction.data === true) && (
          <>
            <Row className="pt-4">
              <Col xs={12}>
                <h4>COLLECTION ACTIONS</h4>
              </Col>
              <Col
                xs={12}
                className="pt-2 d-flex flex-wrap align-items-center gap-3">
                {(isGlobalAdmin() ||
                  createCollectionFunctionAdmin.data === true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() =>
                      setGlobalFocus(GlobalFocus.CREATE_COLLECTION)
                    }>
                    Create Collection
                  </Button>
                )}
                {(isGlobalAdmin() ||
                  airdropTokensFunctionAdmin.data === true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() => setGlobalFocus(GlobalFocus.AIRDROP_TOKENS)}>
                    Airdrop Tokens
                  </Button>
                )}
                {(isGlobalAdmin() ||
                  updateImagesAttributesFunctionAdmin.data === true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() =>
                      setGlobalFocus(GlobalFocus.UPDATE_IMAGES_ATTRIBUTES)
                    }>
                    Update Images and Attributes
                  </Button>
                )}
                {(isGlobalAdmin() ||
                  setFinalSupplyFunctionAdmin.data === true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() =>
                      setGlobalFocus(GlobalFocus.SET_FINAL_SUPPLY)
                    }>
                    Set Final Supply
                  </Button>
                )}
              </Col>
              <Col
                xs={12}
                className="pt-3 d-flex flex-wrap align-items-center gap-3">
                {(isGlobalAdmin() ||
                  initializeBurnFunctionAdmin.data === true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() => setGlobalFocus(GlobalFocus.INITIALIZE_BURN)}>
                    Initialize Burn
                  </Button>
                )}
                {(isGlobalAdmin() ||
                  initializeExternalBurnSwapFunctionAdmin.data === true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() =>
                      setGlobalFocus(GlobalFocus.INITIALIZE_EXTERNAL_BURN_SWAP)
                    }>
                    Initialize External Burn/Swap
                  </Button>
                )}
                {(isGlobalAdmin() ||
                  mintAndAuctionFunctionAdmin.data === true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() =>
                      setGlobalFocus(GlobalFocus.MINT_AND_AUCTION)
                    }>
                    Mint & Auction
                  </Button>
                )}
                {(isGlobalAdmin() ||
                  updateDelegationCollectionAdminFunction.data === true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() =>
                      setGlobalFocus(GlobalFocus.UPDATE_DELEGATION_COLLECTION)
                    }>
                    Update Delegation Collection
                  </Button>
                )}
              </Col>
            </Row>
            <Row className="pt-3">
              <Col>
                {globalFocus === GlobalFocus.CREATE_COLLECTION && (
                  <NextGenAdminCreateCollection close={() => close()} />
                )}
                {globalFocus === GlobalFocus.AIRDROP_TOKENS && (
                  <NextGenAdminAirdropTokens close={() => close()} />
                )}
                {globalFocus === GlobalFocus.UPDATE_IMAGES_ATTRIBUTES && (
                  <NextGenAdminUpdateImagesAttributes close={() => close()} />
                )}
                {globalFocus === GlobalFocus.SET_FINAL_SUPPLY && (
                  <NextGenAdminSetFinalSupply close={() => close()} />
                )}
                {globalFocus === GlobalFocus.INITIALIZE_BURN && (
                  <NextGenAdminInitializeBurn close={() => close()} />
                )}
                {globalFocus === GlobalFocus.MINT_AND_AUCTION && (
                  <NextGenAdminMintAndAuction close={() => close()} />
                )}
                {globalFocus === GlobalFocus.INITIALIZE_EXTERNAL_BURN_SWAP && (
                  <NextGenAdminInitializeExternalBurnSwap
                    close={() => close()}
                  />
                )}
                {globalFocus === GlobalFocus.UPDATE_DELEGATION_COLLECTION && (
                  <NextGenAdminUpdateDelegationCollection
                    close={() => close()}
                  />
                )}
              </Col>
            </Row>
          </>
        )}
        {(isGlobalAdmin() ||
          setSplitsFunctionAdmin.data === true ||
          proposePrimaryAddressesAndPercentagesFunctionAdmin.data === true ||
          proposeSecondaryAddressesAndPercentagesFunctionAdmin.data === true ||
          acceptAddressesAndPercentagesFunctionAdmin.data === true ||
          payArtistFunctionAdmin.data === true) && (
          <>
            <Row className="pt-4">
              <Col xs={12}>
                <h4>PAY</h4>
              </Col>
              <Col
                xs={12}
                className="pt-3 d-flex flex-wrap align-items-center gap-3">
                {(isGlobalAdmin() || setSplitsFunctionAdmin.data === true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() =>
                      setGlobalFocus(
                        GlobalFocus.SET_PRIMARY_AND_SECONDARY_SPLITS
                      )
                    }>
                    Set Splits
                  </Button>
                )}
                {(isGlobalAdmin() ||
                  proposePrimaryAddressesAndPercentagesFunctionAdmin.data ===
                    true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() =>
                      setGlobalFocus(
                        GlobalFocus.PROPOSE_PRIMARY_ADDRESSES_AND_PERCENTAGES
                      )
                    }>
                    Propose Primary Addresses and Percentages
                  </Button>
                )}
                {(isGlobalAdmin() ||
                  proposeSecondaryAddressesAndPercentagesFunctionAdmin.data ===
                    true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() =>
                      setGlobalFocus(
                        GlobalFocus.PROPOSE_SECONDARY_ADDRESSES_AND_PERCENTAGES
                      )
                    }>
                    Propose Secondary Addresses and Percentages
                  </Button>
                )}
                {(isGlobalAdmin() ||
                  acceptAddressesAndPercentagesFunctionAdmin.data === true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() =>
                      setGlobalFocus(
                        GlobalFocus.ACCEPT_ADDRESSES_AND_PERCENTAGES
                      )
                    }>
                    Accept Addresses and Percentages
                  </Button>
                )}
                {(isGlobalAdmin() || payArtistFunctionAdmin.data === true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() => setGlobalFocus(GlobalFocus.PAY_ARTIST)}>
                    Pay Artist
                  </Button>
                )}
              </Col>
            </Row>
            <Row className="pt-3">
              <Col>
                {globalFocus ===
                  GlobalFocus.SET_PRIMARY_AND_SECONDARY_SPLITS && (
                  <NextGenAdminSetSplits close={() => close()} />
                )}
                {globalFocus ===
                  GlobalFocus.PROPOSE_PRIMARY_ADDRESSES_AND_PERCENTAGES && (
                  <NextGenAdminProposeAddressesAndPercentages
                    type={ProposalType.PRIMARY}
                    close={() => close()}
                  />
                )}
                {globalFocus ===
                  GlobalFocus.PROPOSE_SECONDARY_ADDRESSES_AND_PERCENTAGES && (
                  <NextGenAdminProposeAddressesAndPercentages
                    type={ProposalType.SECONDARY}
                    close={() => close()}
                  />
                )}
                {globalFocus ===
                  GlobalFocus.ACCEPT_ADDRESSES_AND_PERCENTAGES && (
                  <NextGenAdminAcceptAddressesAndPercentages
                    close={() => close()}
                  />
                )}
                {globalFocus === GlobalFocus.PAY_ARTIST && (
                  <NextGenAdminPayArtist close={() => close()} />
                )}
              </Col>
            </Row>
          </>
        )}
        {isGlobalAdmin() && (
          <>
            <Row className="pt-4">
              <Col xs={12}>
                <h4>REGISTER / REVOKE ADMINS</h4>
              </Col>
              <Col
                xs={12}
                className="pt-2 d-flex flex-wrap align-items-center gap-3">
                <Button
                  className="seize-btn btn-white"
                  onClick={() =>
                    setGlobalFocus(GlobalFocus.REGISTER_GLOBAL_ADMIN)
                  }>
                  Global Admins
                </Button>
                <Button
                  className="seize-btn btn-white"
                  onClick={() =>
                    setGlobalFocus(GlobalFocus.REGISTER_FUNCTION_ADMIN)
                  }>
                  Function Admins
                </Button>
                <Button
                  className="seize-btn btn-white"
                  onClick={() =>
                    setGlobalFocus(GlobalFocus.REGISTER_COLLECTION_ADMIN)
                  }>
                  Collection Admins
                </Button>
              </Col>
            </Row>
            <Row className="pt-3">
              <Col>
                {globalFocus === GlobalFocus.REGISTER_GLOBAL_ADMIN && (
                  <NextGenAdminRegisterAdmin
                    type={ADMIN_TYPE.GLOBAL}
                    close={() => close()}
                  />
                )}
                {globalFocus === GlobalFocus.REGISTER_FUNCTION_ADMIN && (
                  <NextGenAdminRegisterAdmin
                    type={ADMIN_TYPE.FUNCTION}
                    close={() => close()}
                  />
                )}
                {globalFocus === GlobalFocus.REGISTER_COLLECTION_ADMIN && (
                  <NextGenAdminRegisterAdmin
                    type={ADMIN_TYPE.COLLECTION}
                    close={() => close()}
                  />
                )}
              </Col>
            </Row>
          </>
        )}
        {(isGlobalAdmin() || addRandomizerFunctionAdmin.data === true) && (
          <>
            <Row className="pt-4">
              <Col xs={12}>
                <h4>CONTRACT ACTIONS</h4>
              </Col>
              <Col
                xs={12}
                className="pt-2 d-flex flex-wrap align-items-center gap-3">
                {(isGlobalAdmin() ||
                  addRandomizerFunctionAdmin.data === true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() => setGlobalFocus(GlobalFocus.ADD_RANDOMIZER)}>
                    Add Randomizer
                  </Button>
                )}
              </Col>
            </Row>
            <Row className="pt-3">
              <Col>
                {globalFocus === GlobalFocus.ADD_RANDOMIZER && (
                  <NextGenAdminAddRandomizer close={() => close()} />
                )}
              </Col>
            </Row>
          </>
        )}
      </Container>
    );
  }

  function printCollection() {
    if (
      !isGlobalAdmin() &&
      !isWalletCollectionAdmin &&
      setDataFunctionAdmin.data === false &&
      setCostsFunctionAdmin.data === false &&
      setPhasesFunctionAdmin.data === false &&
      updateInfoFunctionAdmin.data === false &&
      changeMetadataViewFunctionAdmin.data === false
    ) {
      return (
        <Container className="no-padding">
          <Row className="pt-2">
            <Col className="d-flex flex-column align-items-center gap-3">
              <h4 className="font-color">
                ONLY ADMIN WALLETS CAN USE THIS dAPP.
              </h4>
              <h4 className="font-color">
                PLEASE USE AN ADMIN WALLET TO CONTINUE.
              </h4>
            </Col>
          </Row>
        </Container>
      );
    }

    return (
      <Container>
        {(isGlobalAdmin() ||
          isWalletCollectionAdmin ||
          setDataFunctionAdmin.data === true ||
          setCostsFunctionAdmin.data === true ||
          setPhasesFunctionAdmin.data === true) && (
          <>
            <Row className="pt-4">
              <Col xs={12}>
                <h4>SET DATA</h4>
              </Col>
              <Col
                xs={12}
                className="pt-2 d-flex flex-wrap align-items-center gap-3">
                {(isGlobalAdmin() ||
                  isWalletCollectionAdmin ||
                  setDataFunctionAdmin.data === true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() =>
                      setCollectionFocus(CollectionFocus.SET_DATA)
                    }>
                    Set Data
                  </Button>
                )}
                {(isGlobalAdmin() ||
                  isWalletCollectionAdmin ||
                  setCostsFunctionAdmin.data === true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() =>
                      setCollectionFocus(CollectionFocus.SET_COSTS)
                    }>
                    Set Costs
                  </Button>
                )}
                {(isGlobalAdmin() ||
                  isWalletCollectionAdmin ||
                  setPhasesFunctionAdmin.data === true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() =>
                      setCollectionFocus(CollectionFocus.SET_PHASES)
                    }>
                    Set Phases
                  </Button>
                )}
              </Col>
            </Row>
            <Row className="pt-3">
              <Col>
                {collectionFocus === CollectionFocus.SET_DATA && (
                  <NextGenAdminSetData close={() => close()} />
                )}
                {collectionFocus === CollectionFocus.SET_COSTS && (
                  <NextGenAdminSetCosts close={() => close()} />
                )}
                {collectionFocus === CollectionFocus.SET_PHASES && (
                  <NextGenAdminSetPhases close={() => close()} />
                )}
              </Col>
            </Row>
          </>
        )}
        {(isGlobalAdmin() ||
          isWalletCollectionAdmin ||
          updateInfoFunctionAdmin.data === true ||
          changeMetadataViewFunctionAdmin.data === true) && (
          <>
            <Row className="pt-4">
              <Col xs={12}>
                <h4>UPDATE COLLECTION</h4>
              </Col>
              <Col
                xs={12}
                className="pt-2 d-flex flex-wrap align-items-center gap-3">
                {(isGlobalAdmin() ||
                  isWalletCollectionAdmin ||
                  updateInfoFunctionAdmin.data === true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() =>
                      setCollectionFocus(CollectionFocus.UPDATE_INFO)
                    }>
                    Update Info
                  </Button>
                )}
                {(isGlobalAdmin() ||
                  isWalletCollectionAdmin ||
                  updateInfoFunctionAdmin.data === true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() =>
                      setCollectionFocus(CollectionFocus.UPDATE_BASE_URI)
                    }>
                    Update Base URI
                  </Button>
                )}
                {(isGlobalAdmin() ||
                  isWalletCollectionAdmin ||
                  updateInfoFunctionAdmin.data === true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() =>
                      setCollectionFocus(CollectionFocus.UPDATE_SCRIPT_BY_INDEX)
                    }>
                    Update Script By Index
                  </Button>
                )}
                {(isGlobalAdmin() ||
                  isWalletCollectionAdmin ||
                  changeMetadataViewFunctionAdmin.data === true) && (
                  <Button
                    className="seize-btn btn-white"
                    onClick={() =>
                      setCollectionFocus(CollectionFocus.CHANGE_METADATA_VIEW)
                    }>
                    Change Metadata View
                  </Button>
                )}
              </Col>
            </Row>
            <Row className="pt-3">
              <Col>
                {collectionFocus === CollectionFocus.UPDATE_INFO && (
                  <NextGenAdminUpdateCollection
                    type={UpdateType.UPDATE_INFO}
                    close={() => close()}
                  />
                )}
                {collectionFocus === CollectionFocus.UPDATE_BASE_URI && (
                  <NextGenAdminUpdateCollection
                    type={UpdateType.UPDATE_BASE_URI}
                    close={() => close()}
                  />
                )}
                {collectionFocus === CollectionFocus.UPDATE_SCRIPT_BY_INDEX && (
                  <NextGenAdminUpdateCollection
                    type={UpdateType.UPDATE_SCRIPT}
                    close={() => close()}
                  />
                )}
                {collectionFocus === CollectionFocus.CHANGE_METADATA_VIEW && (
                  <NextGenAdminChangeMetadataView close={() => close()} />
                )}
              </Col>
            </Row>
          </>
        )}
      </Container>
    );
  }

  function printArtist() {
    if (!isArtist) {
      return (
        <Container>
          <Row className="pt-2">
            <Col className="d-flex flex-column align-items-center gap-3">
              <h4 className="font-color">
                ONLY COLLECTION ARTISTS CAN USE THIS SECTION.
              </h4>
            </Col>
          </Row>
        </Container>
      );
    }
    return (
      <Container>
        <Row>
          <Col xs={12}>
            <h4>SELECT ACTION</h4>
          </Col>
        </Row>
        <Row className="pt-2">
          <Col className="d-flex align-items-center gap-3">
            <Button
              className="seize-btn btn-white"
              onClick={() => setArtistFocus(ArtistFocus.SIGN_COLLECTION)}>
              Sign Collection
            </Button>
          </Col>
        </Row>
        <Row className="pt-3">
          <Col className="d-flex align-items-center gap-3">
            <Button
              className="seize-btn btn-white"
              onClick={() =>
                setArtistFocus(
                  ArtistFocus.PROPOSE_PRIMARY_ADDRESSES_AND_PERCENTAGES
                )
              }>
              Propose Primary Addresses and Percentages
            </Button>
            <Button
              className="seize-btn btn-white"
              onClick={() =>
                setArtistFocus(
                  ArtistFocus.PROPOSE_SECONDARY_ADDRESSES_AND_PERCENTAGES
                )
              }>
              Propose Secondary Addresses and Percentages
            </Button>
          </Col>
        </Row>
        <Row className="pt-3">
          <Col>
            {artistFocus === ArtistFocus.SIGN_COLLECTION && (
              <NextGenAdminSignCollection close={() => close()} />
            )}
            {artistFocus ===
              ArtistFocus.PROPOSE_PRIMARY_ADDRESSES_AND_PERCENTAGES && (
              <NextGenAdminProposeAddressesAndPercentages
                type={ProposalType.PRIMARY}
                close={() => close()}
              />
            )}
            {artistFocus ===
              ArtistFocus.PROPOSE_SECONDARY_ADDRESSES_AND_PERCENTAGES && (
              <NextGenAdminProposeAddressesAndPercentages
                type={ProposalType.SECONDARY}
                close={() => close()}
              />
            )}
          </Col>
        </Row>
      </Container>
    );
  }

  function printContent() {
    if (!account.isConnected) {
      return <ConnectWalletButton chain_id={NEXTGEN_CHAIN_ID} />;
    }

    switch (focus) {
      case Focus.GLOBAL:
        return printGlobal();
      case Focus.COLLECTION:
        return printCollection();
      case Focus.ARTIST:
        return printArtist();
    }
  }

  function isGlobalAdmin() {
    return globalAdmin.data === true;
  }

  return (
    <Container>
      <Row className="pt-4">
        <Col>
          <h1>NEXTGEN ADMIN</h1>
        </Col>
      </Row>
      <Row className="pt-3">
        <Col xs={12} sm={3} md={2}>
          {printLeftMenu()}
        </Col>
        <Col xs={12} sm={9} md={10}>
          {printContent()}
        </Col>
      </Row>
    </Container>
  );
}
