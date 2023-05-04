import { Web3Modal, useWeb3Modal } from "@web3modal/react";
import { Web3Button } from "@web3modal/react";
import { mainnet } from "wagmi/chains";

import styles from "./Header.module.scss";
import {
  Container,
  Row,
  Col,
  Nav,
  Navbar,
  NavDropdown,
  Dropdown,
} from "react-bootstrap";
import { useAccount, useClient } from "wagmi";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Image from "next/image";
import { AboutSection } from "../../pages/about/[section]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DBResponse } from "../../entities/IDBResponse";
import { fetchUrl } from "../../services/6529api";
import Cookies from "js-cookie";
import { CW_PROJECT_ID, VIEW_MODE_COOKIE } from "../../constants";
import { EthereumClient } from "@web3modal/ethereum";

interface Props {
  onLoad?: () => void;
  onSetWallets?(wallets: string[]): any;
}

enum VIEW {
  CONSOLIDATION = "Consolidation",
  WALLET = "Wallet",
}

export default function Header(props: Props) {
  const router = useRouter();
  const client = useClient();
  const web3Modal = useWeb3Modal();
  const ethereumClient = new EthereumClient(client, [mainnet]);
  const [consolidations, setConsolidations] = useState<string[]>([]);
  const [isConsolidation, setIsConsolidation] = useState(false);
  const { address, connector, isConnected } = useAccount();
  const [burgerMenuOpen, setBurgerMenuOpen] = useState(false);
  const [viewModeOpen, setViewModeOpen] = useState(false);
  const [view, setView] = useState<VIEW>();
  const [showBurgerMenuAbout, setShowBurgerMenuAbout] = useState(false);
  const [setShowBurgerMenuCommunity, setsetShowBurgerMenuCommunity] =
    useState(false);

  useEffect(() => {
    const viewMode = Cookies.get(VIEW_MODE_COOKIE);
    console.log(VIEW_MODE_COOKIE, viewMode);
    if (viewMode == VIEW.CONSOLIDATION) {
      setView(VIEW.CONSOLIDATION);
    } else {
      setView(VIEW.WALLET);
    }
  }, []);

  useEffect(() => {
    if (view) {
      Cookies.set(VIEW_MODE_COOKIE, view);
      if (props.onSetWallets) {
        if (isConsolidation && view == VIEW.CONSOLIDATION) {
          props.onSetWallets(consolidations);
        } else if (address) {
          props.onSetWallets([address]);
        }
      }
    }
  }, [view, isConsolidation]);

  useEffect(() => {
    function handleResize() {
      setBurgerMenuOpen(false);
      setShowBurgerMenuAbout(false);
      setsetShowBurgerMenuCommunity(false);
    }

    window.addEventListener("resize", handleResize);

    handleResize();

    if (props.onLoad) {
      props.onLoad();
    }
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/consolidations/${address}`
      ).then((response: DBResponse) => {
        setConsolidations(Array.from(response.data));
      });
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (consolidations.length > 1) {
      setIsConsolidation(true);
    } else {
      setIsConsolidation(false);
    }
  }, [consolidations]);

  function printBurgerMenu() {
    return (
      <div
        className={`${styles.burgerMenu} ${
          burgerMenuOpen ? styles.burgerMenuOpen : ""
        }`}>
        <FontAwesomeIcon
          className={styles.burgerMenuClose}
          icon="times-circle"
          onClick={() => {
            setBurgerMenuOpen(false);
            setShowBurgerMenuAbout(false);
            setsetShowBurgerMenuCommunity(false);
          }}></FontAwesomeIcon>
        <Container className="text-center">
          <Row className="pt-5 pb-4">
            <Col>
              <Image
                loading="eager"
                priority
                className={styles.logoIcon}
                src="/Seize_Logo_Glasses.png"
                alt="6539Seize"
                width={319}
                height={50}
              />
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <h3 className="d-flex justify-content-center">
                {isConnected ? (
                  <>
                    <Web3Button
                      label="Connect"
                      icon="hide"
                      avatar="hide"
                      balance="hide"
                    />
                    <NavDropdown
                      title={
                        <button
                          className={`${styles.userDropdownBtn} ${
                            view == VIEW.CONSOLIDATION &&
                            isConsolidation &&
                            !web3Modal.isOpen
                              ? styles.userDropdownBtnConsolidation
                              : ""
                          }`}>
                          <span className={styles.userDropdownBtnIcon}></span>
                        </button>
                      }
                      className={`${styles.userDropdown}`}
                      align={"end"}>
                      <NavDropdown.Item
                        className={styles.dropdownItemProfile}
                        onClick={() =>
                          (window.location.href = `/${address as string}`)
                        }>
                        Profile
                      </NavDropdown.Item>
                      {isConsolidation && (
                        <NavDropdown.Item
                          className={styles.dropdownItemViewMode}>
                          <Dropdown
                            onMouseEnter={() => setViewModeOpen(true)}
                            onMouseLeave={() => setViewModeOpen(false)}
                            className={styles.viewModeDropdown}
                            drop={"down-centered"}
                            show={viewModeOpen}>
                            <Dropdown.Toggle>View Mode</Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item
                                className="d-flex align-items-center"
                                onClick={() => setView(VIEW.WALLET)}>
                                {view == VIEW.WALLET && (
                                  <FontAwesomeIcon
                                    className={styles.viewModeIcon}
                                    icon="check-circle"></FontAwesomeIcon>
                                )}
                                Wallet
                              </Dropdown.Item>
                              <Dropdown.Item
                                className="d-flex align-items-center"
                                onClick={() => setView(VIEW.CONSOLIDATION)}>
                                {view == VIEW.CONSOLIDATION && (
                                  <FontAwesomeIcon
                                    className={`${styles.viewModeIcon} ${styles.viewModeIconConsolidation}`}
                                    icon="check-circle"></FontAwesomeIcon>
                                )}
                                Consolidation
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </NavDropdown.Item>
                      )}
                    </NavDropdown>
                  </>
                ) : (
                  <Web3Button
                    label="Connect"
                    icon="hide"
                    avatar="hide"
                    balance="hide"
                  />
                )}
              </h3>
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <a href="/the-memes?sort=age&sort_dir=ASC">
                <h3>The Memes</h3>
              </a>
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <a href="/6529-gradient?sort=id&sort_dir=ASC">
                <h3>Gradient</h3>
              </a>
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <a href="/meme-lab">
                <h3>Meme Lab</h3>
              </a>
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <a href="/rememes">
                <h3>ReMemes</h3>
              </a>
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <a href="/delegation/delegation-center">
                <h3>Delegation</h3>
              </a>
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <h3
                onClick={() => {
                  setsetShowBurgerMenuCommunity(!setShowBurgerMenuCommunity);
                  setShowBurgerMenuAbout(false);
                }}
                className={
                  setShowBurgerMenuCommunity
                    ? styles.burgerMenuCaretClose
                    : styles.burgerMenuCaretOpen
                }>
                Community
              </h3>
            </Col>
            {setShowBurgerMenuCommunity && (
              <Container>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/community">
                      <h3>Community</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/latest-activity">
                      <h3>Latest Activity</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/community-metrics">
                      <h3>Community Metrics</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/consolidation-use-cases">
                      <h3>Consolidation Use Cases</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/downloads">
                      <h3>Downloads</h3>
                    </a>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
              </Container>
            )}
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <h3
                onClick={() => {
                  setShowBurgerMenuAbout(!showBurgerMenuAbout);
                  setsetShowBurgerMenuCommunity(false);
                }}
                className={
                  showBurgerMenuAbout
                    ? styles.burgerMenuCaretClose
                    : styles.burgerMenuCaretOpen
                }>
                About
              </h3>
            </Col>
            {showBurgerMenuAbout && (
              <Container>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.MEMES}`}>
                      <h3>The Memes</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.MEMES_CALENDAR}`}>
                      <h3>Memes Calendar</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.MEME_LAB}`}>
                      <h3>Meme Lab</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.GRADIENTS}`}>
                      <h3>Gradient</h3>
                    </a>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.GDRC1}`}>
                      <h3>GDRC1</h3>
                    </a>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.NFT_DELEGATION}`}>
                      <h3>NFT Delegation</h3>
                    </a>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.FAQ}`}>
                      <h3>FAQ</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.MINTING}`}>
                      <h3>Minting</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.LICENSE}`}>
                      <h3>License</h3>
                    </a>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.APPLY}`}>
                      <h3>Apply</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.CONTACT_US}`}>
                      <h3>Contact Us</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.RELEASE_NOTES}`}>
                      <h3>Release Notes</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.DATA_DECENTR}`}>
                      <h3>Data Decentralization</h3>
                    </a>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.TERMS_OF_SERVICE}`}>
                      <h3>Terms of Service</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.PRIVACY_POLICY}`}>
                      <h3>Privacy Policy</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.COOKIE_POLICY}`}>
                      <h3>Cookie Policy</h3>
                    </a>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
              </Container>
            )}
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <>
      {printBurgerMenu()}
      <Container fluid className={styles.mainContainer}>
        <Row>
          <Col>
            <Container>
              <Row className={styles.headerRow}>
                <Col
                  xs={{ span: 8 }}
                  sm={{ span: 8 }}
                  md={{ span: 8 }}
                  lg={{ span: 3 }}
                  className={`d-flex align-items-center justify-content-start ${styles.headerLeft}`}>
                  <a href="/">
                    <Image
                      loading="eager"
                      priority
                      className={styles.logoIcon}
                      src="/Seize_Logo_Glasses.png"
                      alt="6539Seize"
                      width={319}
                      height={50}
                    />
                  </a>
                </Col>
                <Col
                  xs={{ span: 4 }}
                  sm={{ span: 4 }}
                  md={{ span: 4 }}
                  lg={{ span: 9 }}
                  className={`d-flex align-items-center justify-content-end ${styles.headerRight}`}>
                  <Container>
                    <Navbar expand="lg" variant="dark">
                      <Container
                        className={`d-flex align-items-center justify-content-end no-padding`}>
                        <Image
                          loading="eager"
                          priority
                          width="0"
                          height="0"
                          style={{
                            height: "auto",
                            width: "auto",
                            maxHeight: "42px",
                            paddingLeft: "35px",
                          }}
                          className={`${styles.burgerMenuBtn} d-block ${styles.dMdNone}`}
                          src="/Seize_Logo_2.png"
                          alt="6539Seize"
                          onClick={() => setBurgerMenuOpen(true)}
                        />
                        <Navbar
                          id="seize-navbar-nav"
                          className={`justify-content-end d-none ${styles.dMdBlock}`}>
                          <Nav className="justify-content-end ml-auto">
                            <Nav.Link
                              className={`${styles.mainNavLink} ${
                                router.pathname == "/the-memes" ? "active" : ""
                              }`}
                              href="/the-memes?sort=age&sort_dir=ASC">
                              The Memes
                            </Nav.Link>
                            <Nav.Link
                              className={`${styles.mainNavLink} ${
                                router.pathname == "/6529-gradient"
                                  ? "active"
                                  : ""
                              }`}
                              href="/6529-gradient?sort=id&sort_dir=ASC">
                              Gradient
                            </Nav.Link>
                            <Nav.Link
                              className={`${styles.mainNavLink} ${
                                router.pathname == "/meme-lab" ? "active" : ""
                              }`}
                              href="/meme-lab">
                              Meme Lab
                            </Nav.Link>
                            <Nav.Link
                              className={`${styles.mainNavLink} ${
                                router.pathname == "/rememes" ? "active" : ""
                              }`}
                              href="/rememes">
                              ReMemes
                            </Nav.Link>
                            <NavDropdown
                              title="Community"
                              align={"start"}
                              className={`${styles.mainNavLink} ${styles.mainNavLinkPadding}`}>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/community")
                                }>
                                Community
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/latest-activity")
                                }>
                                Latest Activity
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/community-metrics")
                                }>
                                Community Metrics
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href =
                                    "/consolidation-use-cases")
                                }>
                                Consolidation Use Cases
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/downloads")
                                }>
                                Downloads
                              </NavDropdown.Item>
                            </NavDropdown>
                            <Nav.Link
                              className={`${styles.mainNavLink} ${
                                router.pathname.includes("/delegation/")
                                  ? "active"
                                  : ""
                              }`}
                              href="/delegation/delegation-center">
                              Delegation
                            </Nav.Link>
                            <NavDropdown
                              title="About"
                              className={`${styles.mainNavLink} ${
                                styles.mainNavLinkPadding
                              } ${
                                router.pathname.includes("/about")
                                  ? "active"
                                  : ""
                              }`}
                              align={"start"}>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.MEMES}`)
                                }>
                                The Memes
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.MEMES_CALENDAR}`)
                                }>
                                Memes Calendar
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.MEME_LAB}`)
                                }>
                                Meme Lab
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.GRADIENTS}`)
                                }>
                                Gradient
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.GDRC1}`)
                                }>
                                GDRC1
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.NFT_DELEGATION}`)
                                }>
                                NFT Delegation
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.FAQ}`)
                                }>
                                FAQ
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.MINTING}`)
                                }>
                                Minting
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.LICENSE}`)
                                }>
                                License
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.APPLY}`)
                                }>
                                Apply
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.CONTACT_US}`)
                                }>
                                Contact Us
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.RELEASE_NOTES}`)
                                }>
                                Release Notes
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.DATA_DECENTR}`)
                                }>
                                Data Decentralization
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.TERMS_OF_SERVICE}`)
                                }>
                                Terms of Service
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.PRIVACY_POLICY}`)
                                }>
                                Privacy Policy
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.COOKIE_POLICY}`)
                                }>
                                Cookie Policy
                              </NavDropdown.Item>
                            </NavDropdown>
                            {isConnected ? (
                              <>
                                <Web3Button
                                  label="Connect"
                                  icon="hide"
                                  avatar="hide"
                                  balance="hide"
                                />
                                <NavDropdown
                                  title={
                                    <button
                                      className={`${styles.userDropdownBtn} ${
                                        view == VIEW.CONSOLIDATION &&
                                        isConsolidation &&
                                        !web3Modal.isOpen
                                          ? styles.userDropdownBtnConsolidation
                                          : ""
                                      }`}>
                                      <span
                                        className={
                                          styles.userDropdownBtnIcon
                                        }></span>
                                    </button>
                                  }
                                  className={`${styles.userDropdown}`}
                                  align={"end"}>
                                  <NavDropdown.Item
                                    className={styles.dropdownItemProfile}
                                    onClick={() =>
                                      (window.location.href = `/${
                                        address as string
                                      }`)
                                    }>
                                    Profile
                                  </NavDropdown.Item>
                                  {isConsolidation && (
                                    <NavDropdown.Item
                                      className={styles.dropdownItemViewMode}>
                                      <Dropdown
                                        onMouseEnter={() =>
                                          setViewModeOpen(true)
                                        }
                                        onMouseLeave={() =>
                                          setViewModeOpen(false)
                                        }
                                        className={styles.viewModeDropdown}
                                        drop={"start"}
                                        show={viewModeOpen}>
                                        <Dropdown.Toggle>
                                          View Mode
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                          <Dropdown.Item
                                            className="d-flex align-items-center"
                                            onClick={() =>
                                              setView(VIEW.WALLET)
                                            }>
                                            {view == VIEW.WALLET && (
                                              <FontAwesomeIcon
                                                className={styles.viewModeIcon}
                                                icon="check-circle"></FontAwesomeIcon>
                                            )}
                                            Wallet
                                          </Dropdown.Item>
                                          <Dropdown.Item
                                            className="d-flex align-items-center"
                                            onClick={() =>
                                              setView(VIEW.CONSOLIDATION)
                                            }>
                                            {view == VIEW.CONSOLIDATION && (
                                              <FontAwesomeIcon
                                                className={`${styles.viewModeIcon} ${styles.viewModeIconConsolidation}`}
                                                icon="check-circle"></FontAwesomeIcon>
                                            )}
                                            Consolidation
                                          </Dropdown.Item>
                                        </Dropdown.Menu>
                                      </Dropdown>
                                    </NavDropdown.Item>
                                  )}
                                </NavDropdown>
                              </>
                            ) : (
                              <Web3Button
                                label="Connect"
                                icon="hide"
                                avatar="hide"
                                balance="hide"
                              />
                            )}
                          </Nav>
                        </Navbar>
                        <Image
                          loading="eager"
                          priority
                          width="0"
                          height="0"
                          style={{
                            height: "auto",
                            width: "auto",
                            maxHeight: "42px",
                            paddingLeft: "35px",
                          }}
                          className={`d-none ${styles.dMdBlock}`}
                          src="/Seize_Logo_2.png"
                          alt="6539Seize"
                        />
                      </Container>
                    </Navbar>
                  </Container>
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
      {client && ethereumClient && (
        <Web3Modal
          defaultChain={mainnet}
          projectId={CW_PROJECT_ID}
          ethereumClient={ethereumClient}
          themeMode={"dark"}
          themeVariables={{
            "--w3m-background-color": "#282828",
            "--w3m-logo-image-url": "/Seize_Logo_Glasses_3.png",
            "--w3m-accent-color":
              view == VIEW.CONSOLIDATION && isConsolidation && !web3Modal.isOpen
                ? "#ffffc7"
                : "#fff",
            "--w3m-accent-fill-color": "#000",
            "--w3m-button-border-radius": "0",
            "--w3m-font-family": "Arial",
          }}
        />
      )}
    </>
  );
}
