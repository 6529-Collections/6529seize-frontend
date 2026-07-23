"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Col, Container, Row } from "./NextGenAdminShared";
import NextGenAdminSetData from "./NextGenAdminSetData";
import NextGenAdminSetCosts from "./NextGenAdminSetCosts";
import NextGenAdminSetPhases from "./NextGenAdminSetPhases";
import NextGenAdminRegisterAdmin, {
  ADMIN_TYPE,
} from "./NextGenAdminRegisterAdmin";
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
import NextGenAdminCreateCollection from "./NextGenAdminCreateCollection";
import NextGenAdminUpdateCollection, {
  UpdateType,
} from "./NextGenAdminUpdateCollection";
import NextGenAdminUploadAL from "./NextGenAdminUploadAL";
import HeaderUserConnect from "@/components/header/user/HeaderUserConnect";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useSetTitle } from "@/contexts/TitleContext";
import { useNextGenAdminPermissions } from "./useNextGenAdminPermissions";
import {
  ArtistFocus,
  CollectionFocus,
  Focus,
  GlobalFocus,
  NextGenAdminArtistActions,
  NextGenAdminMenu,
  NextGenAdminRestrictionMessage,
} from "./NextGenAdmin.view";

export { printAdminErrors } from "./NextGenAdminErrors";

export default function NextGenAdmin() {
  const router = useRouter();
  const account = useSeizeConnectContext();
  useSetTitle("NextGen Admin");

  const {
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
  } = useNextGenAdminPermissions(account.address as string);

  const searchParams = useSearchParams()!;
  const [focus, setFocus] = useState<Focus>(
    (searchParams.get("focus") as Focus) || Focus.GLOBAL
  );

  const [globalFocus, setGlobalFocus] = useState<GlobalFocus>();
  const [collectionFocus, setCollectionFocus] = useState<CollectionFocus>();
  const [artistFocus, setArtistFocus] = useState<ArtistFocus>();

  useEffect(() => {
    setGlobalFocus(undefined);
    setCollectionFocus(undefined);
    setArtistFocus(undefined);
    const params = new URLSearchParams(searchParams.toString());
    params.set("focus", focus);
    router.push(`?${params.toString()}`);
  }, [focus]);

  function close() {
    setGlobalFocus(undefined);
    setCollectionFocus(undefined);
    setArtistFocus(undefined);
  }

  function printCreateCollection() {
    return (
      (isGlobalAdmin() || createCollectionFunctionAdmin.data === true) && (
        <Button
          className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
          onClick={() => setGlobalFocus(GlobalFocus.CREATE_COLLECTION)}
        >
          Create Collection
        </Button>
      )
    );
  }

  function printAirdropTokens() {
    return (
      (isGlobalAdmin() || airdropTokensFunctionAdmin.data === true) && (
        <Button
          className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
          onClick={() => setGlobalFocus(GlobalFocus.AIRDROP_TOKENS)}
        >
          Airdrop Tokens
        </Button>
      )
    );
  }

  function printUpdateImagesAttributes() {
    return (
      (isGlobalAdmin() ||
        updateImagesAttributesFunctionAdmin.data === true) && (
        <Button
          className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
          onClick={() => setGlobalFocus(GlobalFocus.UPDATE_IMAGES_ATTRIBUTES)}
        >
          Update Images and Attributes
        </Button>
      )
    );
  }

  function printSetFinalSupply() {
    return (
      (isGlobalAdmin() || setFinalSupplyFunctionAdmin.data === true) && (
        <Button
          className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
          onClick={() => setGlobalFocus(GlobalFocus.SET_FINAL_SUPPLY)}
        >
          Set Final Supply
        </Button>
      )
    );
  }

  function printInitBurn() {
    return (
      (isGlobalAdmin() || initializeBurnFunctionAdmin.data === true) && (
        <Button
          className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
          onClick={() => setGlobalFocus(GlobalFocus.INITIALIZE_BURN)}
        >
          Initialize Burn
        </Button>
      )
    );
  }

  function printInitExternalBurnSwap() {
    return (
      (isGlobalAdmin() ||
        initializeExternalBurnSwapFunctionAdmin.data === true) && (
        <Button
          className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
          onClick={() =>
            setGlobalFocus(GlobalFocus.INITIALIZE_EXTERNAL_BURN_SWAP)
          }
        >
          Initialize External Burn/Swap
        </Button>
      )
    );
  }

  function printMintAuction() {
    return (
      (isGlobalAdmin() || mintAndAuctionFunctionAdmin.data === true) && (
        <Button
          className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
          onClick={() => setGlobalFocus(GlobalFocus.MINT_AND_AUCTION)}
        >
          Mint & Auction
        </Button>
      )
    );
  }

  function printAdminCollectionActions() {
    return (
      (isGlobalAdmin() ||
        createCollectionFunctionAdmin.data === true ||
        airdropTokensFunctionAdmin.data === true ||
        updateImagesAttributesFunctionAdmin.data === true ||
        setFinalSupplyFunctionAdmin.data === true ||
        initializeBurnFunctionAdmin.data === true ||
        mintAndAuctionFunctionAdmin.data === true ||
        initializeExternalBurnSwapFunctionAdmin.data === true) && (
        <>
          <Row className="tw-pt-6">
            <Col xs={12}>
              <h4 className="tw-text-base tw-font-bold tw-text-white md:tw-text-lg">
                COLLECTION ACTIONS
              </h4>
            </Col>
            <Col
              xs={12}
              className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 tw-pt-2"
            >
              {printCreateCollection()}
              {printAirdropTokens()}
              {printUpdateImagesAttributes()}
              {printSetFinalSupply()}
            </Col>
            <Col
              xs={12}
              className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 tw-pt-4"
            >
              {printInitBurn()}
              {printInitExternalBurnSwap()}
              {printMintAuction()}
            </Col>
          </Row>
          <Row className="tw-pt-4">
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
                <NextGenAdminInitializeExternalBurnSwap close={() => close()} />
              )}
            </Col>
          </Row>
        </>
      )
    );
  }

  function printSetSplits() {
    return (
      (isGlobalAdmin() || setSplitsFunctionAdmin.data === true) && (
        <Button
          className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
          onClick={() =>
            setGlobalFocus(GlobalFocus.SET_PRIMARY_AND_SECONDARY_SPLITS)
          }
        >
          Set Splits
        </Button>
      )
    );
  }

  function printProposePrimary() {
    return (
      (isGlobalAdmin() ||
        proposePrimaryAddressesAndPercentagesFunctionAdmin.data === true) && (
        <Button
          className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
          onClick={() =>
            setGlobalFocus(
              GlobalFocus.PROPOSE_PRIMARY_ADDRESSES_AND_PERCENTAGES
            )
          }
        >
          Propose Primary Addresses and Percentages
        </Button>
      )
    );
  }

  function printProposeSecondary() {
    return (
      (isGlobalAdmin() ||
        proposeSecondaryAddressesAndPercentagesFunctionAdmin.data === true) && (
        <Button
          className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
          onClick={() =>
            setGlobalFocus(
              GlobalFocus.PROPOSE_SECONDARY_ADDRESSES_AND_PERCENTAGES
            )
          }
        >
          Propose Secondary Addresses and Percentages
        </Button>
      )
    );
  }

  function printAcceptAddressesAndPercentages() {
    return (
      (isGlobalAdmin() ||
        acceptAddressesAndPercentagesFunctionAdmin.data === true) && (
        <Button
          className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
          onClick={() =>
            setGlobalFocus(GlobalFocus.ACCEPT_ADDRESSES_AND_PERCENTAGES)
          }
        >
          Accept Addresses and Percentages
        </Button>
      )
    );
  }

  function printPayArtist() {
    return (
      (isGlobalAdmin() || payArtistFunctionAdmin.data === true) && (
        <Button
          className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
          onClick={() => setGlobalFocus(GlobalFocus.PAY_ARTIST)}
        >
          Pay Artist
        </Button>
      )
    );
  }

  function printPayActions() {
    return (
      (isGlobalAdmin() ||
        setSplitsFunctionAdmin.data === true ||
        proposePrimaryAddressesAndPercentagesFunctionAdmin.data === true ||
        proposeSecondaryAddressesAndPercentagesFunctionAdmin.data === true ||
        acceptAddressesAndPercentagesFunctionAdmin.data === true ||
        payArtistFunctionAdmin.data === true) && (
        <>
          <Row className="tw-pt-6">
            <Col xs={12}>
              <h4 className="tw-text-base tw-font-bold tw-text-white md:tw-text-lg">
                PAY
              </h4>
            </Col>
            <Col
              xs={12}
              className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 tw-pt-4"
            >
              {printSetSplits()}
              {printProposePrimary()}
              {printProposeSecondary()}
              {printAcceptAddressesAndPercentages()}
              {printPayArtist()}
            </Col>
          </Row>
          <Row className="tw-pt-4">
            <Col>
              {globalFocus === GlobalFocus.SET_PRIMARY_AND_SECONDARY_SPLITS && (
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
              {globalFocus === GlobalFocus.ACCEPT_ADDRESSES_AND_PERCENTAGES && (
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
      )
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
      proposePrimaryAddressesAndPercentagesFunctionAdmin.data === false &&
      proposeSecondaryAddressesAndPercentagesFunctionAdmin.data === false &&
      acceptAddressesAndPercentagesFunctionAdmin.data === false &&
      payArtistFunctionAdmin.data === false &&
      mintAndAuctionFunctionAdmin.data === false &&
      initializeExternalBurnSwapFunctionAdmin.data === false
    ) {
      return <NextGenAdminRestrictionMessage />;
    }

    return (
      <Container>
        {printAdminCollectionActions()}
        {printPayActions()}
        {isGlobalAdmin() && (
          <>
            <Row className="tw-pt-6">
              <Col xs={12}>
                <h4 className="tw-text-base tw-font-bold tw-text-white md:tw-text-lg">
                  REGISTER / REVOKE ADMINS
                </h4>
              </Col>
              <Col
                xs={12}
                className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 tw-pt-2"
              >
                <Button
                  className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                  onClick={() =>
                    setGlobalFocus(GlobalFocus.REGISTER_GLOBAL_ADMIN)
                  }
                >
                  Global Admins
                </Button>
                <Button
                  className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                  onClick={() =>
                    setGlobalFocus(GlobalFocus.REGISTER_FUNCTION_ADMIN)
                  }
                >
                  Function Admins
                </Button>
                <Button
                  className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                  onClick={() =>
                    setGlobalFocus(GlobalFocus.REGISTER_COLLECTION_ADMIN)
                  }
                >
                  Collection Admins
                </Button>
              </Col>
            </Row>
            <Row className="tw-pt-4">
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
            <Row className="tw-pt-6">
              <Col xs={12}>
                <h4 className="tw-text-base tw-font-bold tw-text-white md:tw-text-lg">
                  CONTRACT ACTIONS
                </h4>
              </Col>
              <Col
                xs={12}
                className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 tw-pt-2"
              >
                {(isGlobalAdmin() ||
                  addRandomizerFunctionAdmin.data === true) && (
                  <Button
                    className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                    onClick={() => setGlobalFocus(GlobalFocus.ADD_RANDOMIZER)}
                  >
                    Add Randomizer
                  </Button>
                )}
              </Col>
            </Row>
            <Row className="tw-pt-4">
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

  function printSetData() {
    return (
      (isGlobalAdmin() ||
        isWalletCollectionAdmin ||
        setDataFunctionAdmin.data === true ||
        setCostsFunctionAdmin.data === true ||
        setPhasesFunctionAdmin.data === true) && (
        <>
          <Row className="tw-pt-6">
            <Col xs={12}>
              <h4 className="tw-text-base tw-font-bold tw-text-white md:tw-text-lg">
                SET DATA
              </h4>
            </Col>
            <Col
              xs={12}
              className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 tw-pt-2"
            >
              {(isGlobalAdmin() ||
                isWalletCollectionAdmin ||
                setDataFunctionAdmin.data === true) && (
                <Button
                  className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                  onClick={() => setCollectionFocus(CollectionFocus.SET_DATA)}
                >
                  Set Data
                </Button>
              )}
              {(isGlobalAdmin() ||
                isWalletCollectionAdmin ||
                setCostsFunctionAdmin.data === true) && (
                <Button
                  className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                  onClick={() => setCollectionFocus(CollectionFocus.SET_COSTS)}
                >
                  Set Costs
                </Button>
              )}
              {(isGlobalAdmin() ||
                isWalletCollectionAdmin ||
                setPhasesFunctionAdmin.data === true) && (
                <>
                  <Button
                    className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                    onClick={() =>
                      setCollectionFocus(CollectionFocus.UPLOAD_AL)
                    }
                  >
                    Upload Allowlist
                  </Button>
                  <Button
                    className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                    onClick={() =>
                      setCollectionFocus(CollectionFocus.SET_PHASES)
                    }
                  >
                    Set Phases
                  </Button>
                </>
              )}
            </Col>
          </Row>
          <Row className="tw-pt-4">
            <Col>
              {collectionFocus === CollectionFocus.SET_DATA && (
                <NextGenAdminSetData close={() => close()} />
              )}
              {collectionFocus === CollectionFocus.SET_COSTS && (
                <NextGenAdminSetCosts close={() => close()} />
              )}
              {collectionFocus === CollectionFocus.UPLOAD_AL && (
                <NextGenAdminUploadAL close={() => close()} />
              )}
              {collectionFocus === CollectionFocus.SET_PHASES && (
                <NextGenAdminSetPhases close={() => close()} />
              )}
            </Col>
          </Row>
        </>
      )
    );
  }

  function printUpdateCollection() {
    return (
      (isGlobalAdmin() ||
        isWalletCollectionAdmin ||
        updateInfoFunctionAdmin.data === true ||
        changeMetadataViewFunctionAdmin.data === true) && (
        <>
          <Row className="tw-pt-6">
            <Col xs={12}>
              <h4 className="tw-text-base tw-font-bold tw-text-white md:tw-text-lg">
                UPDATE COLLECTION
              </h4>
            </Col>
            <Col
              xs={12}
              className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 tw-pt-2"
            >
              {(isGlobalAdmin() ||
                isWalletCollectionAdmin ||
                updateInfoFunctionAdmin.data === true) && (
                <Button
                  className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                  onClick={() =>
                    setCollectionFocus(CollectionFocus.UPDATE_INFO)
                  }
                >
                  Update Info
                </Button>
              )}
              {(isGlobalAdmin() ||
                isWalletCollectionAdmin ||
                updateInfoFunctionAdmin.data === true) && (
                <Button
                  className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                  onClick={() =>
                    setCollectionFocus(CollectionFocus.UPDATE_BASE_URI)
                  }
                >
                  Update Base URI
                </Button>
              )}
              {(isGlobalAdmin() ||
                isWalletCollectionAdmin ||
                updateInfoFunctionAdmin.data === true) && (
                <Button
                  className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                  onClick={() =>
                    setCollectionFocus(CollectionFocus.UPDATE_SCRIPT_BY_INDEX)
                  }
                >
                  Update Script By Index
                </Button>
              )}
              {(isGlobalAdmin() ||
                isWalletCollectionAdmin ||
                changeMetadataViewFunctionAdmin.data === true) && (
                <Button
                  className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                  onClick={() =>
                    setCollectionFocus(CollectionFocus.CHANGE_METADATA_VIEW)
                  }
                >
                  Change Metadata View
                </Button>
              )}
            </Col>
          </Row>
          <Row className="tw-pt-4">
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
      )
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
      return <NextGenAdminRestrictionMessage />;
    }

    return (
      <Container>
        {printSetData()}
        {printUpdateCollection()}
      </Container>
    );
  }

  function printContent() {
    if (!account.isConnected) {
      return <HeaderUserConnect />;
    }

    switch (focus) {
      case Focus.GLOBAL:
        return printGlobal();
      case Focus.COLLECTION:
        return printCollection();
      case Focus.ARTIST:
        return (
          <NextGenAdminArtistActions
            artistFocus={artistFocus}
            close={close}
            isArtist={isArtist}
            setArtistFocus={setArtistFocus}
          />
        );
    }
  }

  function isGlobalAdmin() {
    return globalAdmin.data === true;
  }

  return (
    <Container>
      <Row className="tw-pt-6">
        <Col>
          <h1>NextGen Admin</h1>
        </Col>
      </Row>
      <Row className="tw-pt-4">
        <Col xs={12} sm={3} md={2}>
          <NextGenAdminMenu focus={focus} setFocus={setFocus} />
        </Col>
        <Col xs={12} sm={9} md={10}>
          {printContent()}
        </Col>
      </Row>
    </Container>
  );
}
