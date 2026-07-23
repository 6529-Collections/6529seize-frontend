import { Button, Col, Container, Row } from "./NextGenAdminShared";
import NextGenAdminArtistSignCollection from "./NextGenAdminArtistSignCollection";
import NextGenAdminProposeAddressesAndPercentages, {
  ProposalType,
} from "./NextGenAdminProposeAddressesAndPercentages";

export enum Focus {
  GLOBAL = "global",
  COLLECTION = "collection",
  ARTIST = "artist",
}

export enum GlobalFocus {
  CREATE_COLLECTION = "create_collection",
  AIRDROP_TOKENS = "airdrop_tokens",
  UPDATE_IMAGES_ATTRIBUTES = "update_images_attributes",
  SET_FINAL_SUPPLY = "set_final_supply",
  ADD_RANDOMIZER = "add_randomizer",
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

export enum CollectionFocus {
  SET_DATA = "set_data",
  SET_COSTS = "set_costs",
  UPLOAD_AL = "upload_al",
  SET_PHASES = "set_phases",
  UPDATE_INFO = "update_info",
  UPDATE_BASE_URI = "update_base_uri",
  UPDATE_SCRIPT_BY_INDEX = "update_script_by_index",
  CHANGE_METADATA_VIEW = "change_metadata_view",
}

export enum ArtistFocus {
  SIGN_COLLECTION = "sign_collection",
  PROPOSE_PRIMARY_ADDRESSES_AND_PERCENTAGES = "propose_primary_addresses_and_percentages",
  PROPOSE_SECONDARY_ADDRESSES_AND_PERCENTAGES = "propose_secondary_addresses_and_percentages",
}

function getAdminTabClassName(active: boolean): string {
  return active
    ? "tw-cursor-pointer tw-scale-[1.01] tw-text-white"
    : "tw-cursor-pointer tw-text-iron-400 hover:tw-scale-[1.01] hover:tw-text-white";
}

export function NextGenAdminMenu({
  focus,
  setFocus,
}: {
  readonly focus: Focus;
  readonly setFocus: (focus: Focus) => void;
}) {
  return (
    <Container className="!tw-p-0">
      <Row className="tw-pb-2 tw-pt-2">
        <Col
          className={getAdminTabClassName(focus === Focus.GLOBAL)}
          onClick={() => setFocus(Focus.GLOBAL)}
        >
          <b>Global</b>
        </Col>
      </Row>
      <Row className="tw-pb-2 tw-pt-2">
        <Col
          className={getAdminTabClassName(focus === Focus.COLLECTION)}
          onClick={() => setFocus(Focus.COLLECTION)}
        >
          <b>Collection</b>
        </Col>
      </Row>
      <Row className="tw-pb-2 tw-pt-2">
        <Col
          className={getAdminTabClassName(focus === Focus.ARTIST)}
          onClick={() => setFocus(Focus.ARTIST)}
        >
          <b>Artist</b>
        </Col>
      </Row>
    </Container>
  );
}

export function NextGenAdminRestrictionMessage() {
  return (
    <Container className="!tw-p-0">
      <Row className="tw-pt-2">
        <Col className="tw-flex tw-flex-col tw-items-center tw-gap-4">
          <h4 className="tw-text-base tw-font-bold tw-text-white md:tw-text-lg">
            ONLY ADMIN WALLETS CAN USE THIS dAPP.
          </h4>
          <h4 className="tw-text-base tw-font-bold tw-text-white md:tw-text-lg">
            PLEASE USE AN ADMIN WALLET TO CONTINUE.
          </h4>
        </Col>
      </Row>
    </Container>
  );
}

export function NextGenAdminArtistActions({
  artistFocus,
  close,
  isArtist,
  setArtistFocus,
}: {
  readonly artistFocus: ArtistFocus | undefined;
  readonly close: () => void;
  readonly isArtist: boolean | undefined;
  readonly setArtistFocus: (focus: ArtistFocus) => void;
}) {
  if (!isArtist) {
    return (
      <Container>
        <Row className="tw-pt-2">
          <Col className="tw-flex tw-flex-col tw-items-center tw-gap-4">
            <h4 className="tw-text-base tw-font-bold tw-text-white md:tw-text-lg">
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
          <h4 className="tw-text-base tw-font-bold tw-text-white md:tw-text-lg">
            SELECT ACTION
          </h4>
        </Col>
      </Row>
      <Row className="tw-pt-2">
        <Col className="tw-flex tw-items-center tw-gap-4">
          <Button
            className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
            onClick={() => setArtistFocus(ArtistFocus.SIGN_COLLECTION)}
          >
            Sign Collection
          </Button>
        </Col>
      </Row>
      <Row className="tw-pt-4">
        <Col className="tw-flex tw-items-center tw-gap-4">
          <Button
            className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
            onClick={() =>
              setArtistFocus(
                ArtistFocus.PROPOSE_PRIMARY_ADDRESSES_AND_PERCENTAGES
              )
            }
          >
            Propose Primary Addresses and Percentages
          </Button>
          <Button
            className="tw-rounded-none tw-border-0 tw-bg-white tw-px-5 tw-py-1.5 tw-font-bold tw-text-black hover:tw-bg-[rgb(215,215,215)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
            onClick={() =>
              setArtistFocus(
                ArtistFocus.PROPOSE_SECONDARY_ADDRESSES_AND_PERCENTAGES
              )
            }
          >
            Propose Secondary Addresses and Percentages
          </Button>
        </Col>
      </Row>
      <Row className="tw-pt-4">
        <Col>
          {artistFocus === ArtistFocus.SIGN_COLLECTION && (
            <NextGenAdminArtistSignCollection close={() => close()} />
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
