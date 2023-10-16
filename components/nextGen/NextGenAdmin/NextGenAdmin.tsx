import { Container, Row, Col, Button } from "react-bootstrap";
import { useAccount, useContractRead } from "wagmi";
import { useEffect, useState } from "react";
import styles from "./NextGenAdmin.module.scss";
import { useRouter } from "next/router";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  isCollectionAdmin,
} from "./admin_helpers";
import ConnectWalletButton from "../../delegation/ConnectWalletButton";
import { NEXTGEN_CHAIN_ID } from "../contracts";
import NextGenAdminCreateCollection from "./NextGenAdminCreateCollection";
import NextGenAdminSetCollectionData from "./NextGenAdminSetCollectionData";
import NextGenAdminSetMintingCosts from "./NextGenAdminSetMintingCosts";
import NextGenAdminSetPhases from "./NextGenAdminSetPhases";
import NextGenAdminRegisterAdmin, {
  ADMIN_TYPE,
} from "./NextGenAdminRegisterAdmin";
import NextGenAdminSignCollection from "./NextGenAdminSignCollection";

enum Focus {
  GLOBAL = "global",
  COLLECTION = "collection",
  ARTIST = "artist",
}

enum GlobalFocus {
  CREATE_COLLECTION = "create_collection",
  UPDATE_COLLECTION_INFO = "update_collection_info",
  UPDATE_BASE_URI = "update_base_uri",
  REGISTER_GLOBAL_ADMIN = "register_global_admin",
  REGISTER_FUNCTION_ADMIN = "register_function_admin",
  REGISTER_COLLECTION_ADMIN = "register_collection_admin",
}

enum CollectionFocus {
  SET_DATA = "set_data",
  SET_MINTING_COSTS = "set_minting_costs",
  SET_PHASES = "set_phases",
  FREEZE = "freeze",
}

enum ArtistFocus {
  SIGN_COLLECTION = "sign_collection",
}

export default function NextGenAdmin() {
  const router = useRouter();
  const account = useAccount();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(account.address as string);
  const collectionIndex = useCollectionIndex();
  const collectionAdmin = useCollectionAdmin(
    account.address as string,
    parseInt(collectionIndex.data as string)
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
    if (globalAdmin.data === false) {
      return (
        <Container className="no-padding">
          <Row>
            <Col className="text-center">
              <b>
                ONLY ADMIN WALLETS CAN USE THIS dAPP.
                <br />
                <br />
                PLEASE USE AN ADMIN WALLET TO CONTINUE.
              </b>
            </Col>
          </Row>
        </Container>
      );
    }
    return (
      <Container>
        <Row>
          <Col>
            <b>Select Action</b>
          </Col>
        </Row>
        <Row className="pt-4">
          <Col xs={12} className="d-flex flex-wrap align-items-center gap-3">
            <Button
              className="seize-btn btn-white"
              onClick={() => setGlobalFocus(GlobalFocus.CREATE_COLLECTION)}>
              Create Collection
            </Button>
            <Button
              className="seize-btn btn-white"
              onClick={() =>
                setGlobalFocus(GlobalFocus.UPDATE_COLLECTION_INFO)
              }>
              Update Collection Info
            </Button>
            <Button
              className="seize-btn btn-white"
              onClick={() => setGlobalFocus(GlobalFocus.UPDATE_BASE_URI)}>
              Update Base URI
            </Button>
          </Col>
          <Col
            xs={12}
            className="pt-3 d-flex flex-wrap align-items-center gap-3">
            <Button
              className="seize-btn btn-white"
              onClick={() => setGlobalFocus(GlobalFocus.REGISTER_GLOBAL_ADMIN)}>
              Register Global Admin
            </Button>
            <Button
              className="seize-btn btn-white"
              onClick={() =>
                setGlobalFocus(GlobalFocus.REGISTER_FUNCTION_ADMIN)
              }>
              Register Function Admin
            </Button>
            <Button
              className="seize-btn btn-white"
              onClick={() =>
                setGlobalFocus(GlobalFocus.REGISTER_COLLECTION_ADMIN)
              }>
              Register Collection Admin
            </Button>
          </Col>
        </Row>
        <Row className="pt-3">
          <Col>
            {globalFocus === GlobalFocus.CREATE_COLLECTION && (
              <NextGenAdminCreateCollection />
            )}
            {globalFocus === GlobalFocus.UPDATE_COLLECTION_INFO && (
              <NextGenAdminCreateCollection update={true} />
            )}
            {globalFocus === GlobalFocus.UPDATE_COLLECTION_INFO && (
              <NextGenAdminUpdateBaseUri />
            )}
            {globalFocus === GlobalFocus.REGISTER_GLOBAL_ADMIN && (
              <NextGenAdminRegisterAdmin type={ADMIN_TYPE.GLOBAL} />
            )}
            {globalFocus === GlobalFocus.REGISTER_FUNCTION_ADMIN && (
              <NextGenAdminRegisterAdmin type={ADMIN_TYPE.FUNCTION} />
            )}
            {globalFocus === GlobalFocus.REGISTER_COLLECTION_ADMIN && (
              <NextGenAdminRegisterAdmin type={ADMIN_TYPE.COLLECTION} />
            )}
          </Col>
        </Row>
      </Container>
    );
  }

  function printCollection() {
    if (
      globalAdmin.data === false &&
      functionAdmin.data === false &&
      !isCollectionAdmin(collectionAdmin)
    ) {
      return (
        <Container className="no-padding">
          <Row>
            <Col className="text-center">
              <b>
                ONLY ADMIN WALLETS CAN USE THIS dAPP.
                <br />
                <br />
                PLEASE USE AN ADMIN WALLET TO CONTINUE.
              </b>
            </Col>
          </Row>
        </Container>
      );
    }
    return (
      <Container>
        <Row>
          <Col>
            <b>Select Action</b>
          </Col>
        </Row>
        <Row className="pt-4">
          <Col className="d-flex align-items-center gap-3">
            <Button
              className="seize-btn btn-white"
              onClick={() => setCollectionFocus(CollectionFocus.SET_DATA)}>
              Set Collection Data
            </Button>
            <Button
              className="seize-btn btn-white"
              onClick={() =>
                setCollectionFocus(CollectionFocus.SET_MINTING_COSTS)
              }>
              Set Minting Costs
            </Button>
            <Button
              className="seize-btn btn-white"
              onClick={() => setCollectionFocus(CollectionFocus.SET_PHASES)}>
              Set Minting Phases
            </Button>
            <Button
              className="seize-btn btn-white"
              onClick={() => setCollectionFocus(CollectionFocus.FREEZE)}>
              Freeze Collection
            </Button>
          </Col>
        </Row>
        <Row className="pt-3">
          <Col>
            {collectionFocus === CollectionFocus.SET_DATA && (
              <NextGenAdminSetCollectionData />
            )}
            {collectionFocus === CollectionFocus.SET_MINTING_COSTS && (
              <NextGenAdminSetMintingCosts />
            )}
            {collectionFocus === CollectionFocus.SET_PHASES && (
              <NextGenAdminSetPhases />
            )}
          </Col>
        </Row>
      </Container>
    );
  }

  function printArtist() {
    if (
      globalAdmin.data === false &&
      functionAdmin.data === false &&
      !isCollectionAdmin(collectionAdmin)
    ) {
      return (
        <Container className="no-padding">
          <Row>
            <Col className="text-center">
              <b>
                ONLY ADMIN WALLETS CAN USE THIS dAPP.
                <br />
                <br />
                PLEASE USE AN ADMIN WALLET TO CONTINUE.
              </b>
            </Col>
          </Row>
        </Container>
      );
    }
    return (
      <Container>
        <Row>
          <Col>
            <b>Select Action</b>
          </Col>
        </Row>
        <Row className="pt-4">
          <Col className="d-flex align-items-center gap-3">
            <Button
              className="seize-btn btn-white"
              onClick={() => setArtistFocus(ArtistFocus.SIGN_COLLECTION)}>
              Sign Collection
            </Button>
          </Col>
        </Row>
        <Row className="pt-3">
          <Col>
            {artistFocus === ArtistFocus.SIGN_COLLECTION && (
              <NextGenAdminSignCollection />
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
